package com.miniecommerce.inventory.reservation;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReserveRequest(
	@NotNull UUID productId,
	@NotNull @Min(1) Integer quantity,
	UUID orderId
) {
}
