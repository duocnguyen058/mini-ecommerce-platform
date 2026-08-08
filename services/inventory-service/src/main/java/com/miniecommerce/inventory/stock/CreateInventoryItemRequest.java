package com.miniecommerce.inventory.stock;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateInventoryItemRequest(
	@NotNull UUID productId,
	@NotBlank @Size(max = 64) String sku,
	@NotBlank @Size(max = 180) String name,
	@NotNull @Min(0) Integer quantityOnHand,
	@Min(0) Integer lowStockThreshold
) {
}
