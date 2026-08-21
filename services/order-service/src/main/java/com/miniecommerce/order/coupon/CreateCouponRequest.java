package com.miniecommerce.order.coupon;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request tạo coupon mới (Admin).
 */
public record CreateCouponRequest(
    @NotBlank @Size(min = 3, max = 50) String code,
    @NotNull Coupon.DiscountType discountType,
    @NotNull @DecimalMin("0.01") BigDecimal discountValue,
    BigDecimal minOrderAmount,
    @Min(1) @Max(100000) int maxUsage,
    Instant expiresAt
) {}
