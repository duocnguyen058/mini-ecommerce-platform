package com.miniecommerce.inventory.stock;

import java.time.Instant;
import java.util.UUID;

public record InventoryItemResponse(
	UUID id,
	UUID productId,
	String sku,
	String name,
	int totalImported,
	int quantityOnHand,
	int quantityReserved,
	int availableQuantity,
	int lowStockThreshold,
	int soldQuantity,
	InventoryStatus status,
	long version,
	Instant createdAt,
	Instant updatedAt
) {

	static InventoryItemResponse from(InventoryItem item) {
		return new InventoryItemResponse(
			item.getId(),
			item.getProductId(),
			item.getSku(),
			item.getName(),
			item.getTotalImported(),
			item.getQuantityOnHand(),
			item.getQuantityReserved(),
			item.getAvailableQuantity(),
			item.getLowStockThreshold(),
			item.getSoldQuantity(),
			deriveStatus(item),
			item.getVersion(),
			item.getCreatedAt(),
			item.getUpdatedAt()
		);
	}

	private static InventoryStatus deriveStatus(InventoryItem item) {
		int available = item.getAvailableQuantity();
		if (available <= 0) {
			return InventoryStatus.OUT_OF_STOCK;
		}
		if (available <= item.getLowStockThreshold()) {
			return InventoryStatus.LOW_STOCK;
		}
		return InventoryStatus.IN_STOCK;
	}
}
