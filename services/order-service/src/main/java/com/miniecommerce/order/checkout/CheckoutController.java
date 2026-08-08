package com.miniecommerce.order.checkout;

import java.net.URI;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miniecommerce.order.order.OrderResponse;

/**
 * Endpoint POST /api/checkout — tạo đơn từ cart hiện tại của user gọi.
 * <p>
 * Bảo mật: chỉ cần authenticated (rule chung {@code anyRequest().authenticated()}).
 * Không nhận {@code userId} từ body — lấy từ JWT {@code sub} để tránh spoof.
 * Idempotency: client gửi header {@code Idempotency-Key} (tùy chọn); gọi lại cùng key
 * → trả order cũ (cùng id), không tạo đơn mới.
 */
@RestController
@RequestMapping("/api")
public class CheckoutController {

	private final CheckoutService checkoutService;

	public CheckoutController(CheckoutService checkoutService) {
		this.checkoutService = checkoutService;
	}

	@PostMapping("/checkout")
	ResponseEntity<OrderResponse> checkout(
		@AuthenticationPrincipal Jwt principal,
		@RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
		@Valid @RequestBody(required = false) CheckoutRequest request
	) {
		// Body tùy chọn — bind {} hoặc rỗng được (record có ctor no-arg).
		CheckoutRequest body = request == null ? new CheckoutRequest() : request;
		OrderResponse response = checkoutService.checkout(userId(principal), body, idempotencyKey);
		// Checkout flow mới: tạo đơn PENDING và return 202 Accepted — đơn chờ admin duyệt.
		// Nếu validation fail (cart rỗng, sản phẩm INACTIVE) → 400 qua exception handler.
		HttpStatus status = switch (response.status()) {
			case PENDING -> HttpStatus.ACCEPTED;
			default -> HttpStatus.CREATED;
		};
		return ResponseEntity.status(status)
			.location(URI.create("/api/orders/" + response.id()))
			.body(response);
	}

	/** Lấy userId từ JWT sub — copy pattern từ cart-service CartController. */
	private UUID userId(Jwt principal) {
		String subject = principal.getSubject();
		return subject == null ? null : UUID.fromString(subject);
	}
}
