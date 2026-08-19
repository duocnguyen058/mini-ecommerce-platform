package com.miniecommerce.catalog.product.media;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_media")
public class ProductMedia {

    @Id
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "variant_id")
    private UUID variantId;

    @Column(name = "media_type", nullable = false, length = 20)
    private String mediaType; // IMAGE, VIDEO, MODEL_360, PDF

    @Column(name = "media_url", nullable = false, length = 500)
    private String mediaUrl;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "alt_text", length = 200)
    private String altText;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ProductMedia() {
    }

    public ProductMedia(UUID productId, UUID variantId, String mediaType, String mediaUrl, String thumbnailUrl, String altText, int sortOrder) {
        this.id = UUID.randomUUID();
        this.productId = productId;
        this.variantId = variantId;
        this.mediaType = mediaType != null ? mediaType : "IMAGE";
        this.mediaUrl = mediaUrl;
        this.thumbnailUrl = thumbnailUrl != null ? thumbnailUrl : mediaUrl;
        this.altText = altText;
        this.sortOrder = sortOrder;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getProductId() {
        return productId;
    }

    public UUID getVariantId() {
        return variantId;
    }

    public String getMediaType() {
        return mediaType;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public String getAltText() {
        return altText;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
