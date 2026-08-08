package com.miniecommerce.order.checkout;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miniecommerce.order.client.cart.CartClient;
import com.miniecommerce.order.client.cart.CartItemSnapshot;
import com.miniecommerce.order.client.cart.CartSnapshot;
import com.miniecommerce.order.client.catalog.CatalogClient;
import com.miniecommerce.order.client.catalog.CatalogClient.ProductSnapshot;
import com.miniecommerce.order.client.inventory.InventoryClient;
import com.miniecommerce.order.idempotency.IdempotencyRecord;
import com.miniecommerce.order.idempotency.IdempotencyRepository;
import com.miniecommerce.order.messaging.OutboxEventRepository;
import com.miniecommerce.order.messaging.OrderEventFactory;
import com.miniecommerce.order.order.Order;
import com.miniecommerce.order.order.OrderItem;
import com.miniecommerce.order.order.OrderRepository;
import com.miniecommerce.order.order.OrderResponse;
import com.miniecommerce.order.shared.exception.InvalidOrderRequestException;
import com.miniecommerce.order.shared.exception.ResourceNotFoundException;

/**
 * Service checkout — flow (theo sơ đồ state machine):
 * <ol>
 * <li>Idempotency replay — gọi lại cùng key → trả order cũ.</li>
 * <li>Lấy cart (customer JWT).</li>
 * <li>Mỗi item: catalog snapshot + validate ACTIVE + kiểm tra tồn kho + tính total.</li>
 * <li>Tạo Order(PENDING) + items + IdempotencyRecord + OutboxEvent(order.created).</li>
 * <li>TRẢ OrderResponse — KHÔNG reserve inventory. Reservation chỉ chạy khi admin
 * PATCH PENDING → CONFIRMED (xem {@code OrderService.updateStatus}).</li>
 * <li>Clear cart ngay sau khi tạo đơn thành công (fire-and-forget). User không cần
 * đợi admin duyệt mới có thể checkout tiếp — cart đã rỗng.</li>
 * </ol>
 *
 * <p>Lý do clear sớm: nếu giữ cart, user có thể checkout 2 lần trước khi admin xử lý,
 * dẫn đến 2 đơn PENDING trùng nội dung. Cart sẽ tự expire theo TTL Redis nếu clear fail.
 */
@Service
public class CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutService.class);

    private final OrderRepository orderRepository;
    private final IdempotencyRepository idempotencyRepository;
    private final OutboxEventRepository outboxRepository;
    private final CartClient cartClient;
    private final CatalogClient catalogClient;
    private final InventoryClient inventoryClient;
    private final OrderEventFactory eventFactory;

    public CheckoutService(OrderRepository orderRepository,
                           IdempotencyRepository idempotencyRepository,
                           OutboxEventRepository outboxRepository,
                           CartClient cartClient,
                           CatalogClient catalogClient,
                           InventoryClient inventoryClient,
                           OrderEventFactory eventFactory) {
        this.orderRepository = orderRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.outboxRepository = outboxRepository;
        this.cartClient = cartClient;
        this.catalogClient = catalogClient;
        this.inventoryClient = inventoryClient;
        this.eventFactory = eventFactory;
    }

    @Transactional
    public OrderResponse checkout(UUID userId, CheckoutRequest request, String idempotencyKey) {
        // (1) Idempotency replay
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<IdempotencyRecord> cached = idempotencyRepository.findById(idempotencyKey);
            if (cached.isPresent() && cached.get().getResponseId() != null) {
                log.info("idempotency replay key={} → trả order {}", idempotencyKey, cached.get().getResponseId());
                return orderRepository.findById(cached.get().getResponseId())
                    .map(OrderResponse::from)
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Order cached không tồn tại: " + cached.get().getResponseId()));
            }
        }

        // (2) Lấy cart
        CartSnapshot cart = cartClient.fetchCart(userId);
        if (cart.items() == null || cart.items().isEmpty()) {
            throw new InvalidOrderRequestException("Giỏ hàng rỗng — không có gì để đặt");
        }

        // (3) Snapshot catalog + validate ACTIVE
        List<ProductSnapshot> products = new ArrayList<>();
        for (CartItemSnapshot cartLine : cart.items()) {
            products.add(catalogClient.fetchProduct(cartLine.productId()));
        }

        // Validate ACTIVE
        for (ProductSnapshot product : products) {
            if (!product.isActive()) {
                throw new InvalidOrderRequestException(
                    "Sản phẩm không đang bán (status=" + product.status() + "): " + product.id());
            }
        }

        // Kiểm tra tồn kho cho tất cả items
        for (int i = 0; i < cart.items().size(); i++) {
            CartItemSnapshot cartLine = cart.items().get(i);
            ProductSnapshot product = products.get(i);
            if (cartLine.quantity() <= 0) {
                throw new InvalidOrderRequestException(
                    "Số lượng không hợp lệ cho sản phẩm " + product.id());
            }
            InventoryClient.StockCheckResponse stock = inventoryClient.checkStock(product.id());
            // Bắt buộc phải có bản ghi tồn kho & số lượng khả dụng đủ — nếu inventory
            // chưa có item (stock == null) thì coi như không có hàng, chặn checkout.
            int available = (stock == null) ? 0 : stock.availableQuantity();
            if (available < cartLine.quantity()) {
                int onHand = (stock == null) ? 0 : stock.quantityOnHand();
                int reserved = (stock == null) ? 0 : stock.quantityReserved();
                throw new InvalidOrderRequestException(
                    "Hết hàng (còn " + available + "/" + onHand
                    + ", đã giữ " + reserved
                    + ") cho sản phẩm " + product.id() + " — cần " + cartLine.quantity());
            }
        }

        // Build order
        Order order = new Order(userId, request.shippingAddress(), request.currency());
        BigDecimal total = BigDecimal.ZERO;
        for (int i = 0; i < cart.items().size(); i++) {
            CartItemSnapshot cartLine = cart.items().get(i);
            ProductSnapshot product = products.get(i);
            BigDecimal unitPrice = product.price();
            OrderItem item = new OrderItem(
                product.id(), product.sku(), product.name(), unitPrice, cartLine.quantity());
            order.addItem(item);
            total = total.add(item.getLineTotal());
        }
        assertTotalMatches(order, total);

        // (4) Persist order + outbox order.created + idempotency record.
        orderRepository.save(order);
        outboxRepository.save(eventFactory.created(order));
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            String requestHash = hashRequest(userId, request);
            IdempotencyRecord record = new IdempotencyRecord(idempotencyKey, requestHash, order.getId());
            idempotencyRepository.save(record);
        }

        // (5) Clear cart sau khi tạo đơn thành công — fire-and-forget.
        try {
            cartClient.clearCart(userId);
        }
        catch (Exception ex) {
            log.warn("clear cart fail for user {} (order {} đã tạo): {}", userId, order.getId(), ex.getMessage());
        }

        log.info("checkout: order {} ở PENDING, chờ admin duyệt ({} items)", order.getId(), order.getItems().size());
        return OrderResponse.from(order);
    }

    private void assertTotalMatches(Order order, BigDecimal expected) {
        if (order.getTotalAmount().compareTo(expected) != 0) {
            throw new IllegalStateException("Tính total sai khi chốt đơn");
        }
    }

    private String hashRequest(UUID userId, CheckoutRequest request) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String repr = userId + "|" + request.shippingAddress() + "|" + request.currency();
            byte[] hash = md.digest(repr.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        }
        catch (NoSuchAlgorithmException ex) {
            return Integer.toHexString((userId + String.valueOf(request)).hashCode());
        }
    }
}
