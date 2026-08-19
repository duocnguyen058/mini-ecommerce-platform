package com.miniecommerce.catalog.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.miniecommerce.catalog.category.CategoryResponse;

public record ProductResponse(
        UUID id,
        UUID brandId,
        String sku,
        String barcode,
        String name,
        String slug,
        String shortDescription,
        String description,
        BigDecimal price,
        BigDecimal originalPrice,
        int discountPercent,
        String imageUrl,
        String videoUrl,
        ProductStatus status,
        int weightG,
        String dimensions,
        String warrantyPolicy,
        String originCountry,
        long viewCount,
        long soldCount,
        long wishlistCount,
        BigDecimal ratingAvg,
        int ratingCount,
        String metaTitle,
        String metaDescription,
        String metaKeywords,
        String canonicalUrl,
        String ogImage,
        String structuredData,
        CategoryResponse category,
        Instant createdAt,
        Instant updatedAt
) {

    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getBrandId(),
                product.getSku(),
                product.getBarcode(),
                product.getName(),
                product.getSlug(),
                product.getShortDescription(),
                product.getDescription(),
                product.getPrice(),
                product.getOriginalPrice(),
                product.getDiscountPercent(),
                product.getImageUrl(),
                product.getVideoUrl(),
                product.getStatus(),
                product.getWeightG(),
                product.getDimensions(),
                product.getWarrantyPolicy(),
                product.getOriginCountry(),
                product.getViewCount(),
                product.getSoldCount(),
                product.getWishlistCount(),
                product.getRatingAvg(),
                product.getRatingCount(),
                product.getMetaTitle(),
                product.getMetaDescription(),
                product.getMetaKeywords(),
                product.getCanonicalUrl(),
                product.getOgImage(),
                product.getStructuredData(),
                CategoryResponse.from(product.getCategory()),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}