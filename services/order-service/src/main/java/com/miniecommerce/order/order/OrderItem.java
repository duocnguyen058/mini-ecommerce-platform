package com.miniecommerce.order.order;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Entity dòng item trong đơn — bảng {@code order_items}.
 * <p>
 * Đây là <strong>snapshot</strong>: {@code productId}/{@code sku}/{@code name}/{@code unitPrice}
 * được chốt tại thời điểm checkout từ Catalog, không thay đổi khi giá catalog đổi sau đó.
 * {@code lineTotal} = {@code unitPrice × quantity} (do backend tính).
 */
@Entity
@Table(
	name = "order_items",
	uniqueConstraints = @UniqueConstraint(name = "uk_order_items_order_product",
		columnNames = { "order_id", "product_id" })
)
public class OrderItem {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "order_id", nullable = false)
	private Order order;

	@Column(name = "product_id", nullable = false)
	private UUID productId;

	@Column(nullable = false, length = 64)
	private String sku;

	@Column(nullable = false, length = 180)
	private String name;

	@Column(name = "unit_price", nullable = false, precision = 19, scale = 2)
	private BigDecimal unitPrice;

	@Column(nullable = false)
	private int quantity;

	@Column(name = "line_total", nullable = false, precision = 19, scale = 2)
	private BigDecimal lineTotal;

	protected OrderItem() {
	}

	public OrderItem(UUID productId, String sku, String name, BigDecimal unitPrice, int quantity) {
		this.productId = productId;
		this.sku = sku;
		this.name = name;
		this.unitPrice = unitPrice;
		this.quantity = quantity;
		this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
	}

	/** Gắn item vào đơn (gọi từ {@link Order#addItem}). */
	void assignTo(Order order) {
		this.order = order;
	}

	public UUID getId() {
		return id;
	}

	public Order getOrder() {
		return order;
	}

	public UUID getProductId() {
		return productId;
	}

	public String getSku() {
		return sku;
	}

	public String getName() {
		return name;
	}

	public BigDecimal getUnitPrice() {
		return unitPrice;
	}

	public int getQuantity() {
		return quantity;
	}

	public BigDecimal getLineTotal() {
		return lineTotal;
	}
}
