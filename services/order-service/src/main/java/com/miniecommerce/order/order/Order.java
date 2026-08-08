package com.miniecommerce.order.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Entity đơn hàng — bảng {@code orders}.
 * <p>
 * {@code shippingAddress} lưu JSONB bằng Hibernate 7 native
 * {@link JdbcTypeCode @JdbcTypeCode(SqlTypes.JSON)} — không cần dependency bên ngoài.
 * <p>
 * Tổng tiền {@link #totalAmount} <strong>do backend tính</strong> từ
 * {@code Σ unit_price * quantity} của các {@link OrderItem} (snapshot giá từ Catalog),
 * KHÔNG nhận từ frontend.
 * <p>
 * State machine (xem {@link OrderStatus}):
 * <pre>
 *  PENDING → CONFIRMED → SHIPPING → DELIVERED → RETURNED
 *     │          │           │
 *     └──────────┴───────────┴→ CANCELLED  (huỷ kèm cancel reservation)
 * </pre>
 */
@Entity
@Table(name = "orders")
public class Order {

	@Id
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private OrderStatus status;

	@Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
	private BigDecimal totalAmount;

	@Column(nullable = false, length = 3)
	private String currency;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "shipping_address", columnDefinition = "jsonb")
	private Address shippingAddress;

	@Column(name = "reservation_id")
	private UUID reservationId;

	@Version
	@Column(nullable = false)
	private long version;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("id ASC")
	@BatchSize(size = 50)
	private final List<OrderItem> items = new ArrayList<>();

	protected Order() {
	}

	public Order(UUID userId, Address shippingAddress, String currency) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.status = OrderStatus.PENDING;
		this.totalAmount = BigDecimal.ZERO;
		this.currency = currency == null || currency.isBlank() ? "VND" : currency;
		this.shippingAddress = shippingAddress;
		this.createdAt = Instant.now();
		this.updatedAt = this.createdAt;
	}

	/** Snapshot một dòng item vào đơn. Tự tính lại {@link #totalAmount}. */
	public void addItem(OrderItem item) {
		item.assignTo(this);
		this.items.add(item);
		this.totalAmount = this.totalAmount.add(item.getLineTotal());
		this.updatedAt = Instant.now();
	}

	/** Admin duyệt đơn PENDING → CONFIRMED. Lưu reservationId khi reserve thành công. */
	public void markConfirmed(UUID reservationId, String note) {
		this.reservationId = reservationId;
		transitionTo(OrderStatus.CONFIRMED, note);
	}

	/** Admin bàn giao vận chuyển CONFIRMED → SHIPPING. */
	public void markShipping(String note) {
		transitionTo(OrderStatus.SHIPPING, note);
	}

	/** Khách nhận hàng SHIPPING → DELIVERED (qua webhook hoặc admin). */
	public void markDelivered(String note) {
		transitionTo(OrderStatus.DELIVERED, note);
	}

	/** Admin xác nhận nhập lại kho DELIVERED → RETURNED. */
	public void markReturned(String note) {
		// reservationId có thể đã null (đã confirm ở DELIVERED).
		transitionTo(OrderStatus.RETURNED, note);
	}

	/** Đơn bị huỷ — áp dụng cho PENDING/CONFIRMED/SHIPPING. Clear reservation. */
	public void markCancelled(String reason) {
		this.reservationId = null;
		transitionTo(OrderStatus.CANCELLED, reason);
	}

	private void transitionTo(OrderStatus target, String note) {
		this.status = target;
		this.updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public OrderStatus getStatus() {
		return status;
	}

	public BigDecimal getTotalAmount() {
		return totalAmount;
	}

	public String getCurrency() {
		return currency;
	}

	public Address getShippingAddress() {
		return shippingAddress;
	}

	public UUID getReservationId() {
		return reservationId;
	}

	public long getVersion() {
		return version;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	/** Danh sách item bất biến — snapshot đơn. */
	public List<OrderItem> getItems() {
		return Collections.unmodifiableList(items);
	}

	/** Đơn thuộc về user này không — dùng để kiểm tra quyền truy cập ở controller. */
	public boolean isOwnedBy(UUID candidateUserId) {
		return userId != null && userId.equals(candidateUserId);
	}
}
