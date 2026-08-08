package com.miniecommerce.inventory.stock;

import jakarta.validation.constraints.NotNull;

public record AdjustStockRequest(
	@NotNull Integer quantityDelta
) {
}
