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
	@NotBlank(message = "Họ và tên người nhận không được để trống")
	@Size(min = 2, max = 100, message = "Họ và tên người nhận phải từ 2-100 ký tự")
	String recipient,

	@NotBlank(message = "Số điện thoại không được để trống")
	@Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
	@Pattern(regexp = "^[0-9+\\-\\s()]+$", message = "Số điện thoại không hợp lệ")
	String phone,

	@NotBlank(message = "Địa chỉ giao hàng không được để trống")
	@Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
	String streetLine,

	@Size(max = 100, message = "Tỉnh/Thành phố tối đa 100 ký tự")
	String city,

	@Size(max = 100, message = "Quận/Huyện tối đa 100 ký tự")
	String district,

	@Size(max = 100, message = "Phường/Xã tối đa 100 ký tự")
	String ward,

	String country,
	UUID userId
) {

	public Address {
		if (country == null || country.isBlank()) {
			country = "VN";
		}
		if (city == null || city.isBlank()) {
			city = "Việt Nam";
		}
	}
}
