package com.miniecommerce.order.coupon;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API quản lý coupon/voucher.
 * <ul>
 *   <li>GET  /api/coupons/available  — Public: danh sách coupon đang active</li>
 *   <li>POST /api/coupons/validate   — Public: validate code + tính discount</li>
 *   <li>POST /api/admin/coupons      — Admin only: tạo coupon mới</li>
 * </ul>
 */
@RestController
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    /** Lấy danh sách coupon đang hoạt động. */
    @GetMapping("/api/coupons/available")
    public List<CouponResponse> getAvailable() {
        return couponService.getAvailable();
    }

    /** Validate coupon code và trả về kết quả + giá trị giảm. */
    @PostMapping("/api/coupons/validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestBody ValidateCouponRequest request) {
        CouponService.ValidateResult result = couponService.validate(
            request.code(), request.orderAmount()
        );
        return ResponseEntity.ok(Map.of(
            "valid", result.valid(),
            "discountAmount", result.discountAmount(),
            "code", result.code() != null ? result.code() : "",
            "message", result.message()
        ));
    }

    /** Admin tạo coupon mới. */
    @PostMapping("/api/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> create(@Valid @RequestBody CreateCouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.create(request));
    }

    /** Request body cho validate endpoint. */
    public record ValidateCouponRequest(String code, BigDecimal orderAmount) {}
}
