package com.miniecommerce.catalog.product.specification;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_specifications")
public class ProductSpecification {

    @Id
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "group_name", nullable = false, length = 80)
    private String groupName;

    @Column(name = "spec_key", nullable = false, length = 100)
    private String specKey;

    @Column(name = "spec_value", nullable = false, length = 255)
    private String specValue;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected ProductSpecification() {
    }

    public ProductSpecification(UUID productId, String groupName, String specKey, String specValue, int sortOrder) {
        this.id = UUID.randomUUID();
        this.productId = productId;
        this.groupName = groupName;
        this.specKey = specKey;
        this.specValue = specValue;
        this.sortOrder = sortOrder;
    }

    public UUID getId() {
        return id;
    }

    public UUID getProductId() {
        return productId;
    }

    public String getGroupName() {
        return groupName;
    }

    public String getSpecKey() {
        return specKey;
    }

    public String getSpecValue() {
        return specValue;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
