package com.miniecommerce.catalog.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.miniecommerce.catalog.category.CategoryResponse;

public record ProductResponse(
	UUID id,
	String sku,
	String name,
	String slug,
	String description,
	BigDecimal price,
	ProductStatus status,
	CategoryResponse category,
	Instant createdAt,
	Instant updatedAt
) {

	static ProductResponse from(Product product) {
		return new ProductResponse(
			product.getId(),
			product.getSku(),
			product.getName(),
			product.getSlug(),
			product.getDescription(),
			product.getPrice(),
			product.getStatus(),
			CategoryResponse.from(product.getCategory()),
			product.getCreatedAt(),
			product.getUpdatedAt()
		);
	}
}

