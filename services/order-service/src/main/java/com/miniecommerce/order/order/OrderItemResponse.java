package com.miniecommerce.order.order;

import java.math.BigDecimal;
import java.util.UUID;
/**
 * DTO dòng item trả về API — snapshot sang từ {@link OrderItem}.
 */
public record OrderItemResponse(
	UUID id,
	UUID productId,
	String sku,
	String name,
	BigDecimal unitPrice,
	int quantity,
	BigDecimal lineTotal
) {

	static OrderItemResponse from(OrderItem item) {
		return new OrderItemResponse(
			item.getId(),
			item.getProductId(),
			item.getSku(),
			item.getName(),
			item.getUnitPrice(),
			item.getQuantity(),
			item.getLineTotal()
		);
	}
}
