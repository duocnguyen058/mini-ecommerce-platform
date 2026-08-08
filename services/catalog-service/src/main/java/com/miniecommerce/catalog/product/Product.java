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

    @Column(nullable = false, unique = true, length = 64)
    private String sku;

    @Column(nullable = false, length = 180)
    private String name;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status;

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
            String sku,
            String name,
            String slug,
            String description,
            BigDecimal price,
            ProductStatus status
    ) {
        this.id = UUID.randomUUID();
        this.category = category;
        this.sku = sku;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.price = price;
        this.status = status;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Category getCategory() {
        return category;
    }

    public String getSku() {
        return sku;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public ProductStatus getStatus() {
        return status;
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

    /**
     * Áp dụng các thay đổi từ {@code UpdateProductRequest}. Mỗi field null trong
     * request được hiểu là "giữ nguyên". {@code updatedAt} tăng lên khi có thay đổi.
     * <p>
     * SKU + category + version không đổi — chúng là định danh / identity.
     */
    public void applyUpdates(
            String newName,
            String newSlug,
            String newDescription,
            java.math.BigDecimal newPrice,
            String newImageUrl,
            ProductStatus newStatus
    ) {
        boolean changed = false;
        if (newName != null && !newName.isBlank() && !newName.equals(this.name)) {
            this.name = newName.trim();
            changed = true;
        }
        if (newSlug != null && !newSlug.isBlank() && !newSlug.equals(this.slug)) {
            this.slug = newSlug.trim();
            changed = true;
        }
        // Description cho phép set null (empty → null để DB lưu NULL thay vì "")
        if (newDescription != null) {
            String trimmed = newDescription.trim();
            String normalized = trimmed.isEmpty() ? null : trimmed;
            if (normalized == null ? this.description != null : !normalized.equals(this.description)) {
                this.description = normalized;
                changed = true;
            }
        }
        if (newPrice != null && newPrice.signum() >= 0 && newPrice.compareTo(this.price) != 0) {
            this.price = newPrice;
            changed = true;
        }
        if (newImageUrl != null) {
            String trimmed = newImageUrl.trim();
            String normalized = trimmed.isEmpty() ? null : trimmed;
            if (normalized == null ? this.imageUrl != null : !normalized.equals(this.imageUrl)) {
                this.imageUrl = normalized;
                changed = true;
            }
        }
        if (newStatus != null && newStatus != this.status) {
            this.status = newStatus;
            changed = true;
        }
        if (changed) {
            this.updatedAt = Instant.now();
        }
    }
}