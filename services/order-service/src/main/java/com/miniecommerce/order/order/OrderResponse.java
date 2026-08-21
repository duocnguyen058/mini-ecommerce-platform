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
	String paymentMethod,
	Address shippingAddress,
	List<UUID> reservationIds,
	long version,
	Instant createdAt,
	Instant updatedAt,
	List<OrderItemResponse> items
) {

	public static OrderResponse from(Order order) {
		List<OrderItemResponse> items = order.getItems() == null
			? List.of()
			: order.getItems().stream()
				.map(OrderItemResponse::from)
				.toList();

		List<UUID> reservations = order.getReservationIds() == null
			? List.of()
			: List.copyOf(order.getReservationIds());

		return new OrderResponse(
			order.getId(),
			order.getUserId(),
			order.getStatus(),
			order.getTotalAmount(),
			order.getCurrency(),
			order.getPaymentMethod(),
			order.getShippingAddress(),
			reservations,
			order.getVersion(),
			order.getCreatedAt(),
			order.getUpdatedAt(),
			items
		);
	}
}
