package com.miniecommerce.catalog.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.miniecommerce.catalog.category.Category;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "products")
public class Product {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "brand_id")
    private UUID brandId;

    @Column(nullable = false, unique = true, length = 64)
    private String sku;

    @Column(length = 64)
    private String barcode;

    @Column(nullable = false, length = 180)
    private String name;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(name = "short_description", columnDefinition = "TEXT")
    private String shortDescription;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @Column(name = "original_price", precision = 19, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "discount_percent")
    private int discountPercent;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status;

    @Column(name = "weight_g")
    private int weightG;

    @Column(length = 100)
    private String dimensions;

    @Column(name = "warranty_policy", length = 255)
    private String warrantyPolicy;

    @Column(name = "origin_country", length = 80)
    private String originCountry;

    @Column(name = "view_count")
    private long viewCount;

    @Column(name = "sold_count")
    private long soldCount;

    @Column(name = "wishlist_count")
    private long wishlistCount;

    @Column(name = "rating_avg", precision = 3, scale = 2)
    private BigDecimal ratingAvg;

    @Column(name = "rating_count")
    private int ratingCount;

    @Column(name = "meta_title", length = 200)
    private String metaTitle;

    @Column(name = "meta_description", length = 500)
    private String metaDescription;

    @Column(name = "meta_keywords", length = 300)
    private String metaKeywords;

    @Column(name = "canonical_url", length = 500)
    private String canonicalUrl;

    @Column(name = "og_image", length = 500)
    private String ogImage;

    @Column(name = "structured_data", columnDefinition = "TEXT")
    private String structuredData;

    @Version
    @Column(nullable = false)
    private long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Product() {
    }

    public Product(
            Category category,
            UUID brandId,
            String sku,
            String name,
            String slug,
            String description,
            BigDecimal price,
            BigDecimal originalPrice,
            int discountPercent,
            String imageUrl,
            ProductStatus status
    ) {
        this.id = UUID.randomUUID();
        this.category = category;
        this.brandId = brandId;
        this.sku = sku;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.price = price;
        this.originalPrice = originalPrice != null ? originalPrice : price;
        this.discountPercent = discountPercent;
        this.imageUrl = imageUrl;
        this.status = status;
        this.ratingAvg = BigDecimal.valueOf(5.0);
        this.ratingCount = 0;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Category getCategory() {
        return category;
    }

    public UUID getBrandId() {
        return brandId;
    }

    public String getSku() {
        return sku;
    }

    public String getBarcode() {
        return barcode;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }

    public int getDiscountPercent() {
        return discountPercent;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public ProductStatus getStatus() {
        return status;
    }

    public int getWeightG() {
        return weightG;
    }

    public String getDimensions() {
        return dimensions;
    }

    public String getWarrantyPolicy() {
        return warrantyPolicy;
    }

    public String getOriginCountry() {
        return originCountry;
    }

    public long getViewCount() {
        return viewCount;
    }

    public long getSoldCount() {
        return soldCount;
    }

    public long getWishlistCount() {
        return wishlistCount;
    }

    public BigDecimal getRatingAvg() {
        return ratingAvg;
    }

    public int getRatingCount() {
        return ratingCount;
    }

    public String getMetaTitle() {
        return metaTitle;
    }

    public String getMetaDescription() {
        return metaDescription;
    }

    public String getMetaKeywords() {
        return metaKeywords;
    }

    public String getCanonicalUrl() {
        return canonicalUrl;
    }

    public String getOgImage() {
        return ogImage;
    }

    public String getStructuredData() {
        return structuredData;
    }

    public long getVersion() {
        return version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public void setBrandId(UUID brandId) {
        this.brandId = brandId;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setStatus(ProductStatus status) {
        this.status = status;
    }

    public void applyUpdates(
            String newName,
            String newSlug,
            String newDescription,
            BigDecimal newPrice,
            String newImageUrl,
            ProductStatus newStatus,
            UUID newBrandId
    ) {
        if (newName != null && !newName.isBlank()) this.name = newName.trim();
        if (newSlug != null && !newSlug.isBlank()) this.slug = newSlug.trim();
        if (newDescription != null) this.description = newDescription.trim();
        if (newPrice != null && newPrice.signum() >= 0) this.price = newPrice;
        if (newImageUrl != null && !newImageUrl.isBlank()) this.imageUrl = newImageUrl.trim();
        if (newStatus != null) this.status = newStatus;
        if (newBrandId != null) this.brandId = newBrandId;
        this.updatedAt = Instant.now();
    }
}