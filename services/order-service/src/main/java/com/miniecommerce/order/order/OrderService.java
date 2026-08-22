package com.miniecommerce.order.order;

import java.util.Set;
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
		if (isAdmin(authentication)) {
			return OrderResponse.from(order);
		}
		UUID callerId = userIdFrom(authentication);
		if (callerId == null || !order.isOwnedBy(callerId)) {
			throw new ResourceNotFoundException("Đơn không tồn tại: " + orderId);
		}
		return OrderResponse.from(order);
	}

	@Transactional(readOnly = true)
	public Page<OrderResponse> listMyOrders(OrderStatus status, Authentication authentication, Pageable pageable) {
		UUID callerId = userIdFrom(authentication);
		if (callerId == null) {
			return Page.empty(pageable);
		}

		Page<Order> page = (status == null)
				? orderRepository.findByUserId(callerId, pageable)
				: orderRepository.findByUserIdAndStatus(callerId, status, pageable);
		return page.map(OrderResponse::from);
	}

	@Transactional(readOnly = true)
	public Page<OrderResponse> listAdminOrders(OrderStatus status, Pageable pageable) {
		Page<Order> page = (status == null)
				? orderRepository.findAll(pageable)
				: orderRepository.findByStatus(status, pageable);
		return page.map(OrderResponse::from);
	}


	@Transactional(readOnly = true)
	public OrderSummaryResponse getSummary() {
		long total = orderRepository.count();
		long pending = orderRepository.countByStatus(OrderStatus.PENDING);
		long confirmed = orderRepository.countByStatus(OrderStatus.CONFIRMED);
		long shipping = orderRepository.countByStatus(OrderStatus.SHIPPING);
		long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
		long cancelled = orderRepository.countByStatus(OrderStatus.CANCELLED);
		long returned = orderRepository.countByStatus(OrderStatus.RETURNED);
		java.math.BigDecimal revenue = orderRepository.calculateDeliveredRevenue();

		java.util.Map<String, Long> map = new java.util.HashMap<>();
		map.put("PENDING", pending);
		map.put("CONFIRMED", confirmed);
		map.put("SHIPPING", shipping);
		map.put("DELIVERED", delivered);
		map.put("CANCELLED", cancelled);
		map.put("RETURNED", returned);

		return new OrderSummaryResponse(
				total,
				revenue,
				pending,
				confirmed,
				shipping,
				delivered,
				cancelled,
				returned,
				map
		);
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
		OrderStatus previousStatus = order.getStatus();
		switch (target) {
			case CONFIRMED -> {
				if (order.getItems().isEmpty()) {
					throw new InvalidOrderRequestException("Đơn không có item — không thể duyệt");
				}
				// Xác nhận reservation hoặc trừ tồn kho thực tế khi Admin duyệt đơn
				try {
					inventoryClient.confirmByOrderId(order.getId());
					log.info("order {} CONFIRMED via confirmByOrderId", order.getId());
				}
				catch (Exception e) {
					log.warn("confirmByOrderId fail for order {}, falling back to adjustStock: {}", order.getId(), e.getMessage());
					for (var item : order.getItems()) {
						try {
							inventoryClient.adjustStock(item.getProductId(), -item.getQuantity());
							log.info("order {} CONFIRMED adjustStock -{} for productId={}", order.getId(), item.getQuantity(), item.getProductId());
						}
						catch (Exception ex) {
							log.error("order {} CONFIRMED adjustStock fail for productId={}: {}", order.getId(), item.getProductId(), ex.getMessage());
							throw new IllegalStateException("Không thể trừ tồn kho sản phẩm " + item.getName() + ": " + ex.getMessage(), ex);
						}
					}
				}
				order.markConfirmed(note);
			}
			case SHIPPING -> order.markShipping(note);
			case DELIVERED -> order.markDelivered(note);
			case CANCELLED -> {
				order.markCancelled(note);
				if (previousStatus == OrderStatus.PENDING) {
					try {
						inventoryClient.cancelByOrderId(order.getId());
						log.info("order {} PENDING cancelByOrderId", order.getId());
					}
					catch (Exception ex) {
						log.warn("order {} cancelByOrderId fail: {}", order.getId(), ex.getMessage());
					}
				}
				else if (previousStatus == OrderStatus.CONFIRMED || previousStatus == OrderStatus.SHIPPING || previousStatus == OrderStatus.DELIVERED) {
					for (var item : order.getItems()) {
						try {
							inventoryClient.adjustStock(item.getProductId(), item.getQuantity());
							log.info("order {} CANCELLED adjustStock +{} for productId={}", order.getId(), item.getQuantity(), item.getProductId());
						}
						catch (Exception ex) {
							log.warn("order {} CANCELLED adjustStock fail for productId={}: {}", order.getId(), item.getProductId(), ex.getMessage());
						}
					}
				}
			}
			case RETURNED -> {
				order.markReturned(note);
				// Nhập hàng trở lại kho cho từng item khi khách trả hàng thành công
				for (var item : order.getItems()) {
					try {
						inventoryClient.adjustStock(item.getProductId(), item.getQuantity());
						log.info("order {} RETURNED adjustStock +{} for productId={}", order.getId(), item.getQuantity(), item.getProductId());
					}
					catch (Exception ex) {
						log.warn("order {} RETURNED adjustStock fail for productId={}: {}", order.getId(), item.getProductId(), ex.getMessage());
					}
				}
			}
		}
	}

	private com.miniecommerce.order.messaging.OutboxEvent eventForTarget(Order order, OrderStatus target) {
		return switch (target) {
			case CONFIRMED, SHIPPING, DELIVERED -> eventFactory.confirmed(order);
			case CANCELLED -> eventFactory.cancelled(order);
			case RETURNED -> eventFactory.returned(order);
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
		order.markCancelled(note);
		Order saved = orderRepository.save(order);

		if (current == OrderStatus.PENDING) {
			try {
				inventoryClient.cancelByOrderId(saved.getId());
			}
			catch (Exception ex) {
				log.warn("customerCancel cancelByOrderId fail for order {}: {}", saved.getId(), ex.getMessage());
			}
		}
		else if (current == OrderStatus.CONFIRMED || current == OrderStatus.SHIPPING) {
			for (var item : saved.getItems()) {
				try {
					inventoryClient.adjustStock(item.getProductId(), item.getQuantity());
					log.info("order {} customerCancel adjustStock +{} for productId={}", saved.getId(), item.getQuantity(), item.getProductId());
				}
				catch (Exception ex) {
					log.warn("order {} customerCancel adjustStock fail for productId={}: {}", saved.getId(), item.getProductId(), ex.getMessage());
				}
			}
		}

		outboxRepository.save(eventFactory.cancelled(saved));
		return OrderResponse.from(saved);
	}

	/**
	 * Customer (chủ đơn) yêu cầu trả hàng cho đơn DELIVERED.
	 */
	@Transactional
	public OrderResponse customerReturn(UUID orderId, Authentication authentication) {
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
		if (current != OrderStatus.DELIVERED) {
			throw new OrderStateException("Chỉ có thể yêu cầu trả hàng với đơn đã giao (DELIVERED)");
		}

		order.markReturned("Khách hàng yêu cầu trả hàng");
		Order saved = orderRepository.save(order);

		// Nhập hàng trở lại kho cho từng item khi trả hàng thành công
		for (var item : saved.getItems()) {
			try {
				inventoryClient.adjustStock(item.getProductId(), item.getQuantity());
				log.info("order {} customerReturn adjustStock +{} for productId={}", saved.getId(), item.getQuantity(), item.getProductId());
			}
			catch (Exception ex) {
				log.warn("order {} customerReturn adjustStock fail for productId={}: {}", saved.getId(), item.getProductId(), ex.getMessage());
			}
		}

		outboxRepository.save(eventFactory.returned(saved));
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
		if (authentication == null) {
			return null;
		}
		if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
			String subject = jwt.getSubject();
			if (subject != null && !subject.isBlank()) {
				try {
					return UUID.fromString(subject);
				} catch (IllegalArgumentException ignored) {
					// Fallback to userId claim if subject was username
					Object claim = jwt.getClaims().get("userId");
					if (claim != null) {
						try {
							return UUID.fromString(claim.toString());
						} catch (IllegalArgumentException ignored2) {}
					}
				}
			}
		}
		String name = authentication.getName();
		if (name != null && !name.isBlank()) {
			try {
				return UUID.fromString(name);
			} catch (IllegalArgumentException ignored) {}
		}
		return null;
	}
}

