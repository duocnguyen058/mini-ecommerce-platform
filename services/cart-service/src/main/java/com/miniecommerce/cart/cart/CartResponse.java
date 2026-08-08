package com.miniecommerce.cart.cart;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CartResponse(
	UUID userId,
	List<CartItemResponse> items,
	int itemCount,
	Instant createdAt,
	Instant updatedAt
) {

	static CartResponse from(Cart cart) {
		return new CartResponse(
			cart.getUserId(),
			cart.getItemList().stream().map(CartItemResponse::from).toList(),
			cart.getItemCount(),
			cart.getCreatedAt(),
			cart.getUpdatedAt()
		);
	}

	static CartResponse empty(UUID userId) {
		return new CartResponse(userId, List.of(), 0, null, null);
	}
}
