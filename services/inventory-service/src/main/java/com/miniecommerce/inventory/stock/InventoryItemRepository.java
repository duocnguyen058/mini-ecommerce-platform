package com.miniecommerce.inventory.stock;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {

	Optional<InventoryItem> findByProductId(UUID productId);

	Optional<InventoryItem> findBySku(String sku);
}
