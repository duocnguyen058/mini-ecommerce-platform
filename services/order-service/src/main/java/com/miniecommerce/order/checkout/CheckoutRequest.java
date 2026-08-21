package com.miniecommerce.order.checkout;

import com.miniecommerce.order.order.Address;

import jakarta.validation.Valid;

/**
 * Body request POST /api/checkout.
 * <p>
 * Bắt buộc {@code shippingAddress} đầy đủ 6 trường (recipient/phone/streetLine/city/district/ward).
 * Backend tự lấy cart từ JWT sub của user gọi, không tin frontend về
 * {@code userId}, {@code items} hay {@code totalAmount}. {@code currency} rỗng → VND.
 * <p>
 * {@code couponCode} tùy chọn — nếu cung cấp, CheckoutService sẽ validate và apply discount.
 * {@code paymentMethod} tùy chọn — COD (default) hoặc ZALOPAY.
 */
public record CheckoutRequest(
	@Valid Address shippingAddress,
	String currency,
	String couponCode,
	String paymentMethod
) {

	/** Constructor rỗng cho binding body {@code {}}. */
	public CheckoutRequest() {
		this(null, null, null, null);
	}
}
