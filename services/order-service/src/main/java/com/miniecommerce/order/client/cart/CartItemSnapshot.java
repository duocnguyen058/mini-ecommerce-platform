package com.miniecommerce.order.client.cart;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Snapshot một dòng item trong giỏ hàng lúc checkout.
 * Lấy từ cart-service qua {@link CartClient#fetchCart(UUID)}.
 *
 * @param productId  id sản phẩm (UUID).
 * @param sku        mã SKU — dùng cho trace/log.
 * @param name       tên sản phẩm (snapshot từ cart — sẽ validate lại từ catalog).
 * @param unitPrice  đơn giá snapshot từ cart (chỉ tham khảo; giá chính thức lấy từ catalog).
 * @param quantity   số lượng muốn đặt.
 */
public record CartItemSnapshot(
	UUID productId,
	String sku,
	String name,
	BigDecimal unitPrice,
	int quantity
) {
}
