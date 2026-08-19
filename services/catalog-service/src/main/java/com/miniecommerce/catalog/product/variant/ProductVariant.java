package com.miniecommerce.catalog.product.variant;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(nullable = false, unique = true, length = 64)
    private String sku;

    @Column(length = 64)
    private String barcode;

    @Column(nullable = false, length = 180)
    private String name;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @Column(name = "original_price", precision = 19, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    @Column(name = "attributes_json", columnDefinition = "TEXT")
    private String attributesJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProductVariant() {
    }

    public ProductVariant(UUID productId, String sku, String barcode, String name, BigDecimal price, BigDecimal originalPrice, String imageUrl, int stockQuantity, String attributesJson) {
        this.id = UUID.randomUUID();
        this.productId = productId;
        this.sku = sku;
        this.barcode = barcode;
        this.name = name;
        this.price = price;
        this.originalPrice = originalPrice;
        this.imageUrl = imageUrl;
        this.stockQuantity = stockQuantity;
        this.attributesJson = attributesJson;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getProductId() {
        return productId;
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

    public BigDecimal getPrice() {
        return price;
    }

    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public String getAttributesJson() {
        return attributesJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
