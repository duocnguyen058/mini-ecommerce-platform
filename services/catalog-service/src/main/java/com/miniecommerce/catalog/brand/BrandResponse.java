package com.miniecommerce.catalog.brand;

import java.time.Instant;
import java.util.UUID;

public record BrandResponse(
        UUID id,
        String name,
        String slug,
        String logoUrl,
        String description,
        String country,
        String metaTitle,
        String metaDescription,
        long productCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static BrandResponse from(Brand brand, long productCount) {
        return new BrandResponse(
                brand.getId(),
                brand.getName(),
                brand.getSlug(),
                brand.getLogoUrl(),
                brand.getDescription(),
                brand.getCountry(),
                brand.getMetaTitle(),
                brand.getMetaDescription(),
                productCount,
                brand.getCreatedAt(),
                brand.getUpdatedAt()
        );
    }
}
