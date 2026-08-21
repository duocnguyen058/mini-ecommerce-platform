package com.miniecommerce.order.order;

import java.math.BigDecimal;
import java.util.Map;

public record OrderSummaryResponse(
		long totalOrders,
		BigDecimal totalRevenue,
		long pendingCount,
		long confirmedCount,
		long shippingCount,
		long deliveredCount,
		long cancelledCount,
		long returnedCount,
		Map<String, Long> statusBreakdown
) {}
