package com.miniecommerce.order.client.inventory;

/**
 * Yêu cầu điều chỉnh tồn kho (PATCH /api/inventory/{productId}/stock).
 */
public record AdjustStockRequest(int quantityDelta) {}
