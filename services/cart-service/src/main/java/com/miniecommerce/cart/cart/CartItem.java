package com.miniecommerce.cart.cart;

import java.time.Instant;
import java.util.UUID;

public class CartItem {

	private UUID productId;
	private int quantity;
	private Instant addedAt;

	public CartItem() {
	}

	public CartItem(UUID productId, int quantity) {
		this.productId = productId;
		this.quantity = quantity;
		this.addedAt = Instant.now();
	}

	public UUID getProductId() {
		return productId;
	}

	public int getQuantity() {
		return quantity;
	}

	public Instant getAddedAt() {
		return addedAt;
	}

	public void setQuantity(int quantity) {
		this.quantity = quantity;
	}

	void touchAddedAt() {
		this.addedAt = Instant.now();
	}
}
