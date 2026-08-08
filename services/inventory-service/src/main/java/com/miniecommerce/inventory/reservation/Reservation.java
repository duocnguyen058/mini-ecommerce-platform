package com.miniecommerce.inventory.reservation;

import java.time.Instant;
import java.util.UUID;

import com.miniecommerce.inventory.stock.InventoryItem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "inventory_reservations")
public class Reservation {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_item_id", nullable = false)
	private InventoryItem inventoryItem;

	@Column(name = "product_id", nullable = false)
	private UUID productId;

	@Column(name = "order_id")
	private UUID orderId;

	@Column(nullable = false)
	private int quantity;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ReservationStatus status;

	@Column(name = "expires_at")
	private Instant expiresAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Reservation() {
	}

	Reservation(InventoryItem inventoryItem, int quantity, UUID orderId, Instant expiresAt) {
		this.id = UUID.randomUUID();
		this.inventoryItem = inventoryItem;
		this.productId = inventoryItem.getProductId();
		this.orderId = orderId;
		this.quantity = quantity;
		this.status = ReservationStatus.PENDING;
		this.expiresAt = expiresAt;
		this.createdAt = Instant.now();
		this.updatedAt = this.createdAt;
	}

	public UUID getId() {
		return id;
	}

	public InventoryItem getInventoryItem() {
		return inventoryItem;
	}

	public UUID getProductId() {
		return productId;
	}

	public UUID getOrderId() {
		return orderId;
	}

	public int getQuantity() {
		return quantity;
	}

	public ReservationStatus getStatus() {
		return status;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	void markConfirmed() {
		this.status = ReservationStatus.CONFIRMED;
		this.updatedAt = Instant.now();
	}

	void markCancelled() {
		this.status = ReservationStatus.CANCELLED;
		this.updatedAt = Instant.now();
	}
}
