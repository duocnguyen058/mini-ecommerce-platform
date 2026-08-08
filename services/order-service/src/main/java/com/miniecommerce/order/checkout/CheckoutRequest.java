package com.miniecommerce.order.checkout;

import com.miniecommerce.order.order.Address;

import jakarta.validation.Valid;

/**
 * Body request POST /api/checkout.
 * <p>
 * Bắt buộc {@code shippingAddress} đầy đủ 6 trường (recipient/phone/streetLine/city/district/ward).
 * Backend tự lấy cart từ JWT sub của user gọi, không tin frontend về
 * {@code userId}, {@code items} hay {@code totalAmount}. {@code currency} rỗng → VND.
 */
public record CheckoutRequest(
	@Valid Address shippingAddress,
	String currency
) {

	/** Constructor rỗng cho binding body {@code {}}. */
	public CheckoutRequest() {
		this(null, null);
	}
}
