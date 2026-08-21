package com.miniecommerce.order.coupon;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entity mã giảm giá (coupon/voucher).
 * <p>
 * Hai loại giảm: PERCENT (% trên tổng đơn) hoặc FIXED (số tiền cố định).
 * Coupon hết hạn theo {@link #expiresAt} và có giới hạn lượt dùng {@link #maxUsage}.
 */
@Entity
@Table(name = "coupons")
public class Coupon {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 10)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 19, scale = 2)
    private BigDecimal discountValue;

    /** Giá trị đơn hàng tối thiểu để áp dụng coupon. */
    @Column(name = "min_order_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    /** Tổng số lần được phép dùng. */
    @Column(name = "max_usage", nullable = false)
    private int maxUsage = 1;

    /** Số lần đã dùng. */
    @Column(name = "used_count", nullable = false)
    private int usedCount = 0;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Coupon() {}

    public Coupon(String code, DiscountType discountType, BigDecimal discountValue,
                  BigDecimal minOrderAmount, int maxUsage, Instant expiresAt) {
        this.id = UUID.randomUUID();
        this.code = code.toUpperCase().trim();
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.minOrderAmount = minOrderAmount != null ? minOrderAmount : BigDecimal.ZERO;
        this.maxUsage = maxUsage;
        this.usedCount = 0;
        this.isActive = true;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    /** Tính giá trị giảm dựa trên tổng đơn. */
    public BigDecimal calculateDiscount(BigDecimal orderAmount) {
        if (discountType == DiscountType.PERCENT) {
            return orderAmount.multiply(discountValue).divide(BigDecimal.valueOf(100));
        }
        return discountValue.min(orderAmount); // FIXED – không giảm quá tổng đơn
    }

    /** Kiểm tra coupon còn hiệu lực không. */
    public boolean isValid(BigDecimal orderAmount) {
        if (!isActive) return false;
        if (usedCount >= maxUsage) return false;
        if (expiresAt != null && Instant.now().isAfter(expiresAt)) return false;
        if (orderAmount.compareTo(minOrderAmount) < 0) return false;
        return true;
    }

    /** Tăng bộ đếm lượt dùng sau khi áp dụng thành công. */
    public void incrementUsed() {
        this.usedCount++;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getCode() { return code; }
    public DiscountType getDiscountType() { return discountType; }
    public BigDecimal getDiscountValue() { return discountValue; }
    public BigDecimal getMinOrderAmount() { return minOrderAmount; }
    public int getMaxUsage() { return maxUsage; }
    public int getUsedCount() { return usedCount; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isActive() { return isActive; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public enum DiscountType { PERCENT, FIXED }
}
