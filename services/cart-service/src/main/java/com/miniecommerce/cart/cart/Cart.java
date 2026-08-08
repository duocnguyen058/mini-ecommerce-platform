package com.miniecommerce.cart.cart;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public class Cart {

	private UUID userId;
	private Map<UUID, CartItem> items = new LinkedHashMap<>();
	private Instant createdAt;
	private Instant updatedAt;

	public Cart() {
	}

	public Cart(UUID userId) {
		this.userId = userId;
		this.createdAt = Instant.now();
		this.updatedAt = this.createdAt;
	}

	public UUID getUserId() {
		return userId;
	}

	public void setUserId(UUID userId) {
		this.userId = userId;
	}

	/**
	 * Map gốc giữ các item theo productId, dùng để Jackson serialize/deserialize
	 * một cách tự nhiên mà không phải expose cấu trúc nội bộ qua getter trả bản sao.
	 */
	public Map<UUID, CartItem> getItems() {
		return items;
	}

	public void setItems(Map<UUID, CartItem> items) {
		this.items = items == null ? new LinkedHashMap<>() : new LinkedHashMap<>(items);
	}

	/**
	 * Danh sách item cho API response (không tiết lộ cấu trúc Map nội bộ).
	 */
	public List<CartItem> getItemList() {
		return new ArrayList<>(items.values());
	}

	public int getItemCount() {
		int count = 0;
		for (CartItem item : items.values()) {
			if (item != null) {
				count += item.getQuantity();
			}
		}
		return count;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public Optional<CartItem> findItem(UUID productId) {
		return Optional.ofNullable(items.get(productId));
	}

	void add(UUID productId, int quantity) {
		items.compute(productId, (id, existing) -> {
			int newQuantity = (existing == null ? 0 : existing.getQuantity()) + quantity;
			CartItem item = existing == null ? new CartItem(id, newQuantity) : existing;
			item.setQuantity(newQuantity);
			return item;
		});
		updatedAt = Instant.now();
	}

	void setQuantity(UUID productId, int quantity) {
		if (quantity <= 0) {
			items.remove(productId);
		}
		else {
			items.computeIfAbsent(productId, id -> new CartItem(id, quantity));
			items.get(productId).setQuantity(quantity);
		}
		updatedAt = Instant.now();
	}

	void remove(UUID productId) {
		items.remove(productId);
		updatedAt = Instant.now();
	}

	boolean isEmpty() {
		return items.isEmpty();
	}

	void touchUpdatedAt() {
		this.updatedAt = Instant.now();
	}
}
