package com.miniecommerce.cart.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateCartItemRequest(
	@NotNull @Min(0) Integer quantity
) {
}
