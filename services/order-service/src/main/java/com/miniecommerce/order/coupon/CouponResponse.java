package com.miniecommerce.order.coupon;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Response DTO cho coupon.
 *
 * @param id            UUID coupon
 * @param code          Mã coupon (ví dụ: WELCOME10)
 * @param discountType  PERCENT hoặc FIXED
 * @param discountValue Giá trị giảm (% hoặc số tiền VND)
 * @param minOrderAmount Đơn tối thiểu để áp dụng
 * @param maxUsage      Tổng lượt dùng tối đa
 * @param usedCount     Số lần đã dùng
 * @param expiresAt     Thời hạn coupon (null = không giới hạn)
 * @param remainingUsage Lượt còn lại
 */
public record CouponResponse(
    String id,
    String code,
    Coupon.DiscountType discountType,
    BigDecimal discountValue,
    BigDecimal minOrderAmount,
    int maxUsage,
    int usedCount,
    Instant expiresAt,
    int remainingUsage
) {
    public static CouponResponse from(Coupon c) {
        return new CouponResponse(
            c.getId().toString(),
            c.getCode(),
            c.getDiscountType(),
            c.getDiscountValue(),
            c.getMinOrderAmount(),
            c.getMaxUsage(),
            c.getUsedCount(),
            c.getExpiresAt(),
            Math.max(0, c.getMaxUsage() - c.getUsedCount())
        );
    }

    public static List<CouponResponse> fromList(List<Coupon> coupons) {
        return coupons.stream().map(CouponResponse::from).toList();
    }
}
