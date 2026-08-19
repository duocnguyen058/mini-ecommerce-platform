package com.miniecommerce.catalog.product.unit;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_units")
public class ProductUnit {

    @Id
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "unit_name", nullable = false, length = 50)
    private String unitName;

    @Column(name = "conversion_rate", nullable = false)
    private int conversionRate;

    @Column(nullable = false, unique = true, length = 64)
    private String sku;

    @Column(length = 64)
    private String barcode;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProductUnit() {
    }

    public ProductUnit(UUID productId, String unitName, int conversionRate, String sku, String barcode, BigDecimal price, int stockQuantity) {
        this.id = UUID.randomUUID();
        this.productId = productId;
        this.unitName = unitName;
        this.conversionRate = conversionRate;
        this.sku = sku;
        this.barcode = barcode;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getProductId() {
        return productId;
    }

    public String getUnitName() {
        return unitName;
    }

    public int getConversionRate() {
        return conversionRate;
    }

    public String getSku() {
        return sku;
    }

    public String getBarcode() {
        return barcode;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
