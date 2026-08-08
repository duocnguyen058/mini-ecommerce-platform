package com.miniecommerce.order.messaging;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Payload event đơn hàng — publish tới exchange {@code order.events}.
 * <p>
 * Đây là sự thật ("event is truth") để các service khác (inventory, payment...)
 * biết trạng thái đơn đã thay đổi. Field cố định để consumer dễ deserialize.
 *
 * @param eventId      id duy nhất của event (== OutboxEvent.id — idempotency cho consumer).
 * @param eventType    {@code order.created} | {@code order.confirmed} | {@code order.cancelled}.
 * @param orderId      id đơn hàng.
 * @param userId       id khách hàng.
 * @param status       trạng thái đơn sau khi chuyển.
 * @param totalAmount  tổng tiền (backend tính).
 * @param currency    mã tiền tệ.
 * @param reservationId id reservation inventory (nếu có).
 * @param items        snapshot dòng item — consumer biết sản phẩm/khối lượng.
 * @param occurredAt   thời điểm tạo event (== createdAt của OutboxEvent).
 */
public record OrderEvent(
	UUID eventId,
	String eventType,
	UUID orderId,
	UUID userId,
	String status,
	BigDecimal totalAmount,
	String currency,
	UUID reservationId,
	List<OrderItemLine> items,
	Instant occurredAt
) {

	public record OrderItemLine(
		UUID productId,
		String sku,
		String name,
		BigDecimal unitPrice,
		int quantity,
		BigDecimal lineTotal
	) {
	}
}
