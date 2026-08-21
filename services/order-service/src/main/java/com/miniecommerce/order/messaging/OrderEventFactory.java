package com.miniecommerce.order.messaging;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import com.miniecommerce.order.order.Order;
import com.miniecommerce.order.order.OrderItem;
import com.miniecommerce.order.shared.exception.RemoteServiceException;

/**
 * Factory build {@link OrderEvent} từ {@link Order} + serialize payload
 * để lưu {@link OutboxEvent}. Dùng {@link ObjectMapper} của Spring (Jackson 3).
 */
@Component
public class OrderEventFactory {

	private final ObjectMapper objectMapper;

	public OrderEventFactory(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	/** Tạo {@link OutboxEvent} cho event {@code order.created}. */
	public OutboxEvent created(Order order) {
		return build(order, "order.created");
	}

	/** Tạo {@link OutboxEvent} cho event {@code order.confirmed}. */
	public OutboxEvent confirmed(Order order) {
		return build(order, "order.confirmed");
	}

	/** Tạo {@link OutboxEvent} cho event {@code order.cancelled} (cả REJECTED và CANCELLED). */
	public OutboxEvent cancelled(Order order) {
		return build(order, "order.cancelled");
	}

	/** Tạo {@link OutboxEvent} cho event {@code order.returned}. */
	public OutboxEvent returned(Order order) {
		return build(order, "order.returned");
	}

	private OutboxEvent build(Order order, String eventType) {
		String customerName = (order.getShippingAddress() != null && order.getShippingAddress().recipient() != null)
				? order.getShippingAddress().recipient()
				: "Khách hàng";
		int totalQty = order.getItems().stream().mapToInt(OrderItem::getQuantity).sum();

		OrderEvent event = new OrderEvent(
			UUID.randomUUID(),
			eventType,
			order.getId(),
			order.getUserId(),
			customerName,
			totalQty,
			order.getStatus().name(),
			order.getTotalAmount(),
			order.getCurrency(),
			List.copyOf(order.getReservationIds()),
			order.getItems().stream()
				.map(OrderEventFactory::lineFrom)
				.toList(),
			order.getUpdatedAt()
		);
		try {
			String payload = objectMapper.writeValueAsString(event);
			// Aggregate type cứng = "Order" để consumer routing theo type.
			return new OutboxEvent("Order", order.getId(), eventType, payload);
		}
		catch (JacksonException ex) {
			// Không nên xảy ra — record thuần dữ liệu, Jackson 3 serialize ổn định.
			throw new RemoteServiceException(
				"Không serialize được OrderEvent: " + ex.getMessage(), 500);
		}
	}

	private static OrderEvent.OrderItemLine lineFrom(OrderItem item) {
		return new OrderEvent.OrderItemLine(
			item.getProductId(),
			item.getSku(),
			item.getName(),
			item.getUnitPrice(),
			item.getQuantity(),
			item.getLineTotal()
		);
	}
}
