package com.miniecommerce.order.order;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miniecommerce.order.client.inventory.InventoryClient;
import com.miniecommerce.order.client.inventory.InventoryClient.ReserveRequest;
import com.miniecommerce.order.client.inventory.InventoryClient.ReservationResponse;
import com.miniecommerce.order.messaging.OrderEventFactory;
import com.miniecommerce.order.messaging.OutboxEventRepository;
import com.miniecommerce.order.shared.exception.InvalidOrderRequestException;
import com.miniecommerce.order.shared.exception.OrderStateException;
import com.miniecommerce.order.shared.exception.ResourceNotFoundException;

/**
 * Service đọc + admin update + customer huỷ đơn hàng.
 *
 * <p>State machine (xem {@link OrderStatus}):
 * <pre>
 * PENDING ─► CONFIRMED ─► SHIPPING ─► DELIVERED ─► RETURNED
 * │         │             │
 * └─────────┴─────────────┴─► CANCELLED (cancel reservation nếu có)
 * </pre>
 *
 * <p>Side-effects với Inventory:
 * <ul>
 *   <li>PENDING → CONFIRMED: gọi {@code reserve} cho từng item (lưu reservationId).</li>
 *   <li>CONFIRMED → SHIPPING: giữ nguyên reservation.</li>
 *   <li>SHIPPING → DELIVERED: gọi {@code confirm} reservation (trừ tồn thực tế).</li>
 *   <li>PENDING/CONFIRMED/SHIPPING → CANCELLED: gọi {@code cancel} reservation.</li>
 *   <li>DELIVERED → RETURNED: gọi {@code adjustStock(+qty)} — nhập hàng trở lại.</li>
 * </ul>
 */
@Service
public class OrderService {

	private static final Logger log = LoggerFactory.getLogger(OrderService.class);

	private final OrderRepository orderRepository;
	private final OutboxEventRepository outboxRepository;
	private final OrderEventFactory eventFactory;
	private final InventoryClient inventoryClient;

	public OrderService(OrderRepository orderRepository,
						OutboxEventRepository outboxRepository,
						OrderEventFactory eventFactory,
						InventoryClient inventoryClient) {
		this.orderRepository = orderRepository;
		this.outboxRepository = outboxRepository;
		this.eventFactory = eventFactory;
		this.inventoryClient = inventoryClient;
	}

	@Transactional(readOnly = true)
	public OrderResponse getById(UUID orderId, Authentication authentication) {
		Order order = orderRepository.findById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Đơn không tồn tại: " + orderId));
		UUID callerId = userIdFrom(authentication);
		if (!isAdmin(authentication) && !order.isOwnedBy(callerId)) {
			throw new ResourceNotFoundException("Đơn không tồn tại: " + orderId);
		}
		return OrderResponse.from(order);
	}

	@Transactional(readOnly = true)
	public Page<OrderResponse> listOrders(OrderStatus status, Authentication authentication, Pageable pageable) {
		boolean admin = isAdmin(authentication);
		UUID callerId = userIdFrom(authentication);

		Page<Order> page;
		if (admin) {
			page = (status == null)
					? orderRepository.findAll(pageable)
					: orderRepository.findByStatus(status, pageable);
		} else {
			page = (status == null)
					? orderRepository.findByUserId(callerId, pageable)
					: orderRepository.findByUserIdAndStatus(callerId, status, pageable);
		}
		return page.map(OrderResponse::from);
	}

	/**
	 * Admin chuyển trạng thái đơn theo state machine. Side-effects (inventory) chạy
	 * trong cùng transaction.
	 */
	@Transactional
	public OrderResponse updateStatus(UUID orderId, UpdateOrderStatusRequest req, Authentication authentication) {
		if (!isAdmin(authentication)) {
			throw new AccessDeniedException("Chỉ ADMIN được chỉnh trạng thái đơn");
		}

		Order order = orderRepository.findById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Đơn không tồn tại: " + orderId));

		OrderStatus current = order.getStatus();
		OrderStatus target = req.newStatus();
		validateTransition(current, target);

		String note = (req.note() == null || req.note().isBlank())
				? "Admin chỉnh trạng thái"
				: req.note().trim();

		applyTransition(order, target, note);

		Order saved = orderRepository.save(order);
		outboxRepository.save(eventForTarget(saved, target));

		log.info("admin updateStatus order {} {} → {}", saved.getId(), current, target);
		return OrderResponse.from(saved);
	}

	private void validateTransition(OrderStatus current, OrderStatus target) {
		boolean ok = switch (current) {
			case PENDING -> target == OrderStatus.CONFIRMED || target == OrderStatus.CANCELLED;
			case CONFIRMED -> target == OrderStatus.SHIPPING || target == OrderStatus.CANCELLED;
			case SHIPPING -> target == OrderStatus.DELIVERED || target == OrderStatus.CANCELLED;
			case DELIVERED -> target == OrderStatus.RETURNED;
			default -> false;
		};
		if (!ok) {
			throw new OrderStateException("Không thể chuyển từ " + current + " sang " + target);
		}
	}

	private void applyTransition(Order order, OrderStatus target, String note) {
		switch (target) {
			case CONFIRMED -> {
				// Reserve inventory — từng item. Lưu reservationId đầu tiên.
				ReservationResponse first = null;
				for (var item : order.getItems()) {
					ReserveRequest rq = new ReserveRequest(item.getProductId(), item.getQuantity(), order.getId());
					ReservationResponse res = inventoryClient.reserve(rq);
					if (first == null) first = res;
				}
				if (first == null) {
					throw new InvalidOrderRequestException("Đơn không có item — không thể duyệt");
				}
				order.markConfirmed(first.id(), note);
			}
			case SHIPPING -> order.markShipping(note);
			case DELIVERED -> {
				order.markDelivered(note);
				// Confirm reservation ở đây — chỉ gọi 1 lần sau cùng.
				if (order.getReservationId() != null) {
					inventoryClient.confirm(order.getReservationId());
				}
			}
			case CANCELLED -> {
				order.markCancelled(note);
				// Trả lại tồn nếu đã reserve.
				if (order.getReservationId() != null) {
					inventoryClient.cancel(order.getReservationId());
				}
			}
			case RETURNED -> {
				order.markReturned(note);
				// Nhập hàng trở lại kho — DELIVERED đã confirm (trừ tồn thực tế),
				// nên RETURNED cần tăng tồn bằng quantity đã đặt.
				int totalQty = order.getItems().stream().mapToInt(item -> item.getQuantity()).sum();
				if (totalQty > 0) {
					UUID productId = order.getItems().getFirst().getProductId();
					try {
						inventoryClient.adjustStock(productId, totalQty);
						log.info("order {} RETURNED adjustStock +{} for productId={}", order.getId(), totalQty, productId);
					}
					catch (Exception ex) {
						log.warn("order {} RETURNED adjustStock fail: {}", order.getId(), ex.getMessage());
					}
				}
			}
		}
	}

	private com.miniecommerce.order.messaging.OutboxEvent eventForTarget(Order order, OrderStatus target) {
		return switch (target) {
			case CONFIRMED, SHIPPING, DELIVERED -> eventFactory.confirmed(order);
			case CANCELLED, RETURNED -> eventFactory.cancelled(order);
			default -> eventFactory.created(order);
		};
	}

	/**
	 * Customer (chủ đơn) huỷ đơn. Chỉ cho đơn PENDING/CONFIRMED/SHIPPING.
	 */
	@Transactional
	public OrderResponse customerCancel(UUID orderId, Authentication authentication) {
		UUID callerId = userIdFrom(authentication);
		if (callerId == null) {
			throw new AccessDeniedException("Không xác định được userId từ JWT");
		}

		Order order = orderRepository.findById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Đơn không tồn tại: " + orderId));

		if (!order.isOwnedBy(callerId) && !isAdmin(authentication)) {
			throw new ResourceNotFoundException("Đơn không tồn tại: " + orderId);
		}

		OrderStatus current = order.getStatus();
		if (current != OrderStatus.PENDING
				&& current != OrderStatus.CONFIRMED
				&& current != OrderStatus.SHIPPING) {
			throw new OrderStateException("Không thể huỷ đơn ở trạng thái " + current);
		}

		String note = "Khách hàng huỷ đơn";
		UUID reservationId = order.getReservationId();
		order.markCancelled(note);
		Order saved = orderRepository.save(order);

		if (reservationId != null) {
			try {
				inventoryClient.cancel(reservationId);
			}
			catch (Exception ex) {
				log.warn("order {} cancel reservation fail: {}", saved.getId(), ex.getMessage());
			}
		}

		outboxRepository.save(eventFactory.cancelled(saved));
		return OrderResponse.from(saved);
	}

	private boolean isAdmin(Authentication authentication) {
		if (authentication == null || authentication.getAuthorities() == null) return false;
		for (GrantedAuthority auth : authentication.getAuthorities()) {
			if ("ROLE_ADMIN".equals(auth.getAuthority())) return true;
		}
		return false;
	}

	private UUID userIdFrom(Authentication authentication) {
		if (authentication == null || !(authentication.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt)) {
			return null;
		}
		String subject = jwt.getSubject();
		return subject == null ? null : UUID.fromString(subject);
	}
}
