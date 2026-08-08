package com.miniecommerce.order.order;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Body PATCH /api/admin/orders/{id}/status.
 * <p>
 * Admin chuyển đơn từ PENDING sang một trong 3 trạng thái cuối.
 * Service sẽ reject nếu current status khác PENDING hoặc target không phải
 * 1 trong 3 giá trị hợp lệ (trả 409).
 */
public record UpdateOrderStatusRequest(
	@NotNull OrderStatus newStatus,
	@Size(max = 500) String note
) {
}
