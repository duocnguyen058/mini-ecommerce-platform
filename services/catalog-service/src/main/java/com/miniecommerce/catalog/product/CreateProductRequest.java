package com.miniecommerce.catalog.product;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateProductRequest(
	@NotNull UUID categoryId,
	@NotBlank @Size(max = 64) String sku,
	@NotBlank @Size(max = 180) String name,
	@NotBlank
	@Size(max = 200)
	@Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*") String slug,
	@Size(max = 5000) String description,
	@NotNull @DecimalMin("0.00") BigDecimal price,
	ProductStatus status
) {
}

