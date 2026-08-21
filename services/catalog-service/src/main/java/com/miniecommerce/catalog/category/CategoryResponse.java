package com.miniecommerce.catalog.category;

import java.time.Instant;
import java.util.UUID;

public record CategoryResponse(
	UUID id,
	UUID parentId,
	String name,
	String slug,
	String icon,
	String bannerUrl,
	String imageUrl,
	String metaTitle,
	String metaDescription,
	String metaKeywords,
	String canonicalUrl,
	String ogImage,
	String structuredData,
	long productCount,
	Instant createdAt,
	Instant updatedAt
) {

	public static CategoryResponse from(Category category) {
		return from(category, 0);
	}

	public static CategoryResponse from(Category category, long productCount) {
		return new CategoryResponse(
			category.getId(),
			category.getParentId(),
			category.getName(),
			category.getSlug(),
			category.getIcon(),
			category.getBannerUrl(),
			category.getImageUrl(),
			category.getMetaTitle(),
			category.getMetaDescription(),
			category.getMetaKeywords(),
			category.getCanonicalUrl(),
			category.getOgImage(),
			category.getStructuredData(),
			productCount,
			category.getCreatedAt(),
			category.getUpdatedAt()
		);
	}
}

