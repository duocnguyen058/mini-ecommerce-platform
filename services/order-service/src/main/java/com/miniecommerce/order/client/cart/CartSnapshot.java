package com.miniecommerce.order.client.cart;

import java.util.List;
import java.util.UUID;

/**
 * Snapshot giỏ hàng lúc checkout.
 * Lấy từ cart-service qua {@link CartClient#fetchCart(UUID)} (GET /api/cart/{userId}).
 *
 * @param userId id khách hàng (cart key trong Redis).
 * @param items  danh sách dòng item — rỗng nếu user chưa có cart.
 */
public record CartSnapshot(
	UUID userId,
	List<CartItemSnapshot> items
) {
}
