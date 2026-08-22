package com.miniecommerce.inventory.stock;

public record UpdateInventoryItemRequest(
    Integer totalImported,
    Integer quantityOnHand,
    Integer lowStockThreshold
) {}
