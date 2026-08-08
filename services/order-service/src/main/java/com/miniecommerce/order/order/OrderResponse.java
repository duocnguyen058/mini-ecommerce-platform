package com.miniecommerce.order.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO đơn hàng trả về API — sang từ {@link Order}.
 * <p>
 * Bao gồm snapshot {@link #items()} và địa chỉ giao hàng {@link #shippingAddress()}.
 * Tổng tiền {@link #totalAmount()} luôn là giá trị backend tính, không phụ thuộc frontend.
 */
public record OrderResponse(
	UUID id,
	UUID userId,
	OrderStatus status,
	BigDecimal totalAmount,
	String currency,
	Address shippingAddress,
	UUID reservationId,
	long version,
	Instant createdAt,
	Instant updatedAt,
	List<OrderItemResponse> items
) {

	public static OrderResponse from(Order order) {
		List<OrderItemResponse> items = order.getItems().stream()
			.map(OrderItemResponse::from)
			.toList();
		return new OrderResponse(
			order.getId(),
			order.getUserId(),
			order.getStatus(),
			order.getTotalAmount(),
			order.getCurrency(),
			order.getShippingAddress(),
			order.getReservationId(),
			order.getVersion(),
			order.getCreatedAt(),
			order.getUpdatedAt(),
			items
		);
	}
}
