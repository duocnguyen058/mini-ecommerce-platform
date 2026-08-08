package com.miniecommerce.inventory.shared.exception;

/**
 * Yêu cầu không hợp lệ — tương đương HTTP 400 ProblemDetail.
 * <p>
 * Sử dụng cho các vi phạm validation business (vd. productId không tồn tại trong catalog).
 * Tránh nhầm với {@link com.miniecommerce.inventory.shared.exception.ResourceNotFoundException}
 * (404) — lỗi này biết resource không tồn tại nhưng muốn thông báo "yêu cầu của bạn sai".
 */
public class InvalidInventoryRequestException extends RuntimeException {

	public InvalidInventoryRequestException(String message) {
		super(message);
	}
}
