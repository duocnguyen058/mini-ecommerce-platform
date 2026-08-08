package com.miniecommerce.order.order;

/**
 * Vòng đời đơn hàng — flow E-commerce Việt Nam (đơn giản hoá 6 trạng thái).
 *
 * <pre>
 *  Chờ xác nhận ─► Đã xác nhận ─► Đang giao ─► Đã giao ─► Đã trả hàng
 *       │              │              │
 *       └─► Đơn huỷ ◄──┴──────────────┘
 * </pre>
 *
 * <ul>
 *   <li>{@link #PENDING} — User đặt hàng, chờ admin duyệt.</li>
 *   <li>{@link #CONFIRMED} — Admin duyệt (reserve inventory tại đây).</li>
 *   <li>{@link #SHIPPING} — Admin bàn giao vận chuyển.</li>
 *   <li>{@link #DELIVERED} — Khách nhận hàng (webhook xác nhận).</li>
 *   <li>{@link #CANCELLED} — Đơn bị huỷ (user hoặc admin, từ PENDING/CONFIRMED/SHIPPING).</li>
 *   <li>{@link #RETURNED} — Admin xác nhận nhập lại kho (từ DELIVERED).</li>
 * </ul>
 *
 * State cuối (không thể chuyển tiếp): {@link #CANCELLED}, {@link #RETURNED}.
 */
public enum OrderStatus {
	PENDING,
	CONFIRMED,
	SHIPPING,
	DELIVERED,
	CANCELLED,
	RETURNED
}
