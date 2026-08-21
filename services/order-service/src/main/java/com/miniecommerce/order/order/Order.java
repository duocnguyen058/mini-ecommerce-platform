package com.miniecommerce.order.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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

	/** Phương thức thanh toán: COD (default) hoặc ZALOPAY. */
	@Column(name = "payment_method", nullable = false, length = 20)
	private String paymentMethod = "COD";

	/**
	 * Danh sách reservation inventory của đơn — mỗi item được reserve 1 reservation
	 * khi admin duyệt (PENDING → CONFIRMED). Đơn nhiều item ⇒ nhiều reservation;
	 * huỷ/giao sẽ confirm/cancel TẤT CẢ các id này.
	 */
	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "order_reservations", joinColumns = @JoinColumn(name = "order_id"))
	@Column(name = "reservation_id")
	private final Set<UUID> reservationIds = new LinkedHashSet<>();

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

	/**
	 * Ghi nhận 1 reservation inventory vừa reserve thành công cho đơn
	 * (gọi cho TỪNG item khi admin duyệt).
	 */
	public void addReservation(UUID reservationId) {
		this.reservationIds.add(reservationId);
		this.updatedAt = Instant.now();
	}

	/** Admin duyệt đơn PENDING → CONFIRMED (reservation đã được ghi trước đó). */
	public void markConfirmed(String note) {
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
		// Reservation đã confirm ở DELIVERED — giữ danh sách để theo dõi.
		transitionTo(OrderStatus.RETURNED, note);
	}

	/**
	 * Đơn bị huỷ — áp dụng cho PENDING/CONFIRMED/SHIPPING.
	 * Clear danh sách reservation (caller phải lấy {@link #getReservationIds()}
	 * TRƯỚC khi gọi nếu cần cancel ở inventory).
	 */
	public void markCancelled(String reason) {
		this.reservationIds.clear();
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

	/**
	 * Bản sao phòng thủ của danh sách reservation — KHÔNG phải view của collection
	 * nội bộ. Nếu trả view (unmodifiableSet trực tiếp), khi {@link #markCancelled}
	 * clear collection thì bản "chụp" cũng rỗng theo → cancel inventory không chạy.
	 */
	public Set<UUID> getReservationIds() {
		return Collections.unmodifiableSet(new LinkedHashSet<>(reservationIds));
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

	public String getPaymentMethod() { return paymentMethod; }

	public void setPaymentMethod(String paymentMethod) {
		this.paymentMethod = paymentMethod != null ? paymentMethod : "COD";
		this.updatedAt = Instant.now();
	}

	/**
	 * Áp dụng giảm giá từ coupon — trừ trực tiếp vào totalAmount.
	 * Đảm bảo totalAmount không âm sau khi giảm.
	 */
	public void applyDiscount(java.math.BigDecimal discount) {
		if (discount != null && discount.compareTo(java.math.BigDecimal.ZERO) > 0) {
			this.totalAmount = this.totalAmount.subtract(discount).max(java.math.BigDecimal.ZERO);
			this.updatedAt = Instant.now();
		}
	}
}

