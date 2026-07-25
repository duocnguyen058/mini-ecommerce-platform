package com.miniecommerce.catalog.category;

import java.time.Instant;
import java.util.UUID;

public record CategoryResponse(
	UUID id,
	String name,
	String slug,
	Instant createdAt,
	Instant updatedAt
) {

	public static CategoryResponse from(Category category) {
		return new CategoryResponse(
			category.getId(),
			category.getName(),
			category.getSlug(),
			category.getCreatedAt(),
			category.getUpdatedAt()
		);
	}
}
