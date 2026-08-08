package com.miniecommerce.cart.cart;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
public class CartController {

	private final CartService cartService;

	public CartController(CartService cartService) {
		this.cartService = cartService;
	}

	@GetMapping
	ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal Jwt principal) {
		return ResponseEntity.ok(cartService.getCart(userId(principal)));
	}

	@PostMapping("/items")
	ResponseEntity<CartResponse> addItem(
		@AuthenticationPrincipal Jwt principal,
		@Valid @RequestBody AddCartItemRequest request
	) {
		return ResponseEntity.ok(cartService.addItem(userId(principal), request));
	}

	@PatchMapping("/items/{productId}")
	ResponseEntity<CartResponse> setQuantity(
		@AuthenticationPrincipal Jwt principal,
		@PathVariable UUID productId,
		@Valid @RequestBody UpdateCartItemRequest request
	) {
		return ResponseEntity.ok(
			cartService.setQuantity(userId(principal), productId, request.quantity())
		);
	}

	@DeleteMapping("/items/{productId}")
	ResponseEntity<CartResponse> removeItem(
		@AuthenticationPrincipal Jwt principal,
		@PathVariable UUID productId
	) {
		return ResponseEntity.ok(cartService.removeItem(userId(principal), productId));
	}

	@DeleteMapping
	ResponseEntity<Void> clearCart(@AuthenticationPrincipal Jwt principal) {
		cartService.clearCart(userId(principal));
		return ResponseEntity.noContent().build();
	}

	private UUID userId(Jwt principal) {
		String subject = principal.getSubject();
		return subject == null ? null : UUID.fromString(subject);
	}
}
