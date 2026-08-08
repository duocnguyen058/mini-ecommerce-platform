package com.miniecommerce.order.order;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Địa chỉ giao hàng — lưu dạng JSONB trong {@code orders.shipping_address}
 * (Hibernate 7 native {@code @JdbcTypeCode(SqlTypes.JSON)} — không cần dependency ngoài).
 *
 * <p>Validation: 6 trường địa chỉ chính bắt buộc — không cho checkout nếu thiếu.
 * Số điện thoại match regex cơ bản (chữ số, +, -, khoảng trắng, parens).
 *
 * @param recipient  tên người nhận (bắt buộc).
 * @param phone      số điện thoại liên hệ (bắt buộc).
 * @param streetLine số nhà + tên đường (bắt buộc).
 * @param city       tỉnh/thành phố (bắt buộc).
 * @param district   quận/huyện (bắt buộc).
 * @param ward       phường/xã (bắt buộc).
 * @param country    quốc gia (mặc định VN — tùy chọn).
 * @param userId     tùy chọn — id khách hàng nếu có.
 */
public record Address(
	@NotBlank(message = "Tên người nhận không được để trống")
	@Size(max = 100, message = "Tên người nhận tối đa 100 ký tự")
	String recipient,

	@NotBlank(message = "Số điện thoại không được để trống")
	@Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
	@Pattern(regexp = "^[0-9+\\-\\s()]+$", message = "Số điện thoại không hợp lệ")
	String phone,

	@NotBlank(message = "Số nhà, tên đường không được để trống")
	@Size(max = 200, message = "Số nhà, tên đường tối đa 200 ký tự")
	String streetLine,

	@NotBlank(message = "Tỉnh/Thành phố không được để trống")
	@Size(max = 80, message = "Tỉnh/Thành phố tối đa 80 ký tự")
	String city,

	@NotBlank(message = "Quận/Huyện không được để trống")
	@Size(max = 80, message = "Quận/Huyện tối đa 80 ký tự")
	String district,

	@NotBlank(message = "Phường/Xã không được để trống")
	@Size(max = 80, message = "Phường/Xã tối đa 80 ký tự")
	String ward,

	String country,
	UUID userId
) {

	public Address {
		if (country == null || country.isBlank()) {
			country = "VN";
		}
	}
}
