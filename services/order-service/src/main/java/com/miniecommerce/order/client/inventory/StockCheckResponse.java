package com.miniecommerce.order.client.inventory;

import java.util.UUID;

/**
 * DTO trả về khi kiểm tra tồn kho (GET /api/inventory/{productId}).
 * Chỉ giữ các field cần đánh giá available stock.
 */
public record StockCheckResponse(
        UUID id,
        UUID productId,
        int quantityOnHand,
        int quantityReserved,
        int availableQuantity
) {
}
