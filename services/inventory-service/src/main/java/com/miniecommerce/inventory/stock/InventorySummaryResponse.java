package com.miniecommerce.inventory.stock;

public record InventorySummaryResponse(
        long totalItems,
        long totalQuantityOnHand,
        long totalQuantityReserved,
        long totalAvailableQuantity,
        long outOfStockCount,
        long lowStockCount
) {}
