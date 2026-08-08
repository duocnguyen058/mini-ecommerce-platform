package com.miniecommerce.cart.cart;

import java.time.Instant;
import java.util.UUID;

public record CartItemResponse(
	UUID productId,
	int quantity,
	Instant addedAt
) {

	static CartItemResponse from(CartItem item) {
		return new CartItemResponse(item.getProductId(), item.getQuantity(), item.getAddedAt());
	}
}
