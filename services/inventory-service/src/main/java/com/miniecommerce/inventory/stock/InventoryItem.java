package com.miniecommerce.inventory.stock;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

	@Id
	private UUID id;

	@Column(name = "product_id", nullable = false, unique = true)
	private UUID productId;

	@Column(nullable = false, unique = true, length = 64)
	private String sku;

	@Column(nullable = false, length = 180)
	private String name;

	@Column(name = "quantity_on_hand", nullable = false)
	private int quantityOnHand;

	@Column(name = "quantity_reserved", nullable = false)
	private int quantityReserved;

	@Column(name = "low_stock_threshold", nullable = false)
	private int lowStockThreshold;

	@Column(name = "sold_quantity", nullable = false)
	private int soldQuantity = 0;

	@Column(name = "total_imported", nullable = false)
	private int totalImported = 0;

	@Version
	@Column(nullable = false)
	private long version;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected InventoryItem() {
	}

	public InventoryItem(UUID productId, String sku, String name, int quantityOnHand, int lowStockThreshold) {
		this.id = UUID.randomUUID();
		this.productId = productId;
		this.sku = sku;
		this.name = name;
		this.quantityOnHand = quantityOnHand;
		this.quantityReserved = 0;
		this.soldQuantity = 0;
		this.totalImported = quantityOnHand;
		this.lowStockThreshold = lowStockThreshold;
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

	public String getName() {
		return name;
	}

	public int getQuantityOnHand() {
		return quantityOnHand;
	}

	public int getQuantityReserved() {
		return quantityReserved;
	}

	public int getLowStockThreshold() {
		return lowStockThreshold;
	}

	public int getAvailableQuantity() {
		return quantityOnHand - quantityReserved;
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

	public void setQuantityOnHand(int quantityOnHand) {
		this.quantityOnHand = quantityOnHand;
		this.updatedAt = Instant.now();
	}

	public void setLowStockThreshold(int lowStockThreshold) {
		this.lowStockThreshold = lowStockThreshold;
		this.updatedAt = Instant.now();
	}

	public int getSoldQuantity() {
		return soldQuantity;
	}

	public void setSoldQuantity(int soldQuantity) {
		this.soldQuantity = soldQuantity;
		this.updatedAt = Instant.now();
	}

	public int getTotalImported() {
		return totalImported > 0 ? totalImported : (quantityOnHand + soldQuantity);
	}

	public void setTotalImported(int totalImported) {
		this.totalImported = totalImported;
		this.updatedAt = Instant.now();
	}

	public void adjustStock(int delta) {
		this.quantityOnHand += delta;
		if (this.quantityOnHand < 0) {
			this.quantityOnHand = 0;
		}
		if (delta < 0) {
			this.soldQuantity += (-delta);
		} else if (delta > 0 && this.soldQuantity >= delta) {
			this.soldQuantity -= delta;
		}
		this.updatedAt = Instant.now();
	}

	public void reserve(int quantity) {
		this.quantityReserved += quantity;
		this.updatedAt = Instant.now();
	}

	public void release(int quantity) {
		this.quantityReserved -= quantity;
		this.updatedAt = Instant.now();
	}

	public void confirmSale(int quantity) {
		this.quantityOnHand -= quantity;
		this.quantityReserved -= quantity;
		this.soldQuantity += quantity;
		this.updatedAt = Instant.now();
	}
}
