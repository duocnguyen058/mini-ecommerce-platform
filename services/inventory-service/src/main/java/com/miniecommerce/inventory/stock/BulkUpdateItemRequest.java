package com.miniecommerce.inventory.stock;

import java.util.UUID;

public record BulkUpdateItemRequest(
    UUID inventoryItemId,
    String mode,
    int quantity
) {}
