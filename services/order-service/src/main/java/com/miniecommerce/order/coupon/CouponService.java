package com.miniecommerce.order.coupon;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miniecommerce.order.shared.exception.ResourceNotFoundException;

/**
 * Service xử lý logic coupon: validate, apply và quản lý coupon.
 */
@Service
public class CouponService {

    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    /** Lấy danh sách coupon đang available (active + chưa hết hạn + còn lượt). */
    public List<CouponResponse> getAvailable() {
        return CouponResponse.fromList(couponRepository.findAllAvailable());
    }

    /** Validate coupon và trả về kết quả (không áp dụng — chỉ kiểm tra). */
    public ValidateResult validate(String code, BigDecimal orderAmount) {
        Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCase(code);
        if (couponOpt.isEmpty()) {
            return ValidateResult.invalid("Mã coupon không tồn tại");
        }
        Coupon coupon = couponOpt.get();
        if (!coupon.isValid(orderAmount)) {
            if (!coupon.isActive()) return ValidateResult.invalid("Coupon đã bị vô hiệu hóa");
            if (coupon.getUsedCount() >= coupon.getMaxUsage()) return ValidateResult.invalid("Coupon đã hết lượt sử dụng");
            if (coupon.getExpiresAt() != null && java.time.Instant.now().isAfter(coupon.getExpiresAt()))
                return ValidateResult.invalid("Coupon đã hết hạn");
            return ValidateResult.invalid("Đơn hàng tối thiểu " + coupon.getMinOrderAmount() + "₫ để dùng coupon này");
        }
        BigDecimal discount = coupon.calculateDiscount(orderAmount);
        return ValidateResult.valid(discount, coupon.getCode(),
            "Giảm " + (coupon.getDiscountType() == Coupon.DiscountType.PERCENT
                ? coupon.getDiscountValue() + "%" : coupon.getDiscountValue() + "₫"));
    }

    /**
     * Apply coupon: validate + tính discount + tăng usedCount.
     * Chỉ gọi trong @Transactional context (từ CheckoutService).
     */
    @Transactional
    public BigDecimal applyCoupon(String code, BigDecimal orderAmount) {
        ValidateResult result = validate(code, orderAmount);
        if (!result.valid()) {
            throw new com.miniecommerce.order.shared.exception.InvalidOrderRequestException(
                "Coupon không hợp lệ: " + result.message());
        }
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon không tồn tại: " + code));
        coupon.incrementUsed();
        couponRepository.save(coupon);
        return result.discountAmount();
    }

    /** Tạo coupon mới (Admin). */
    @Transactional
    public CouponResponse create(CreateCouponRequest request) {
        if (couponRepository.findByCodeIgnoreCase(request.code()).isPresent()) {
            throw new IllegalArgumentException("Code coupon đã tồn tại: " + request.code());
        }
        Coupon coupon = new Coupon(
            request.code(), request.discountType(), request.discountValue(),
            request.minOrderAmount(), request.maxUsage(), request.expiresAt()
        );
        return CouponResponse.from(couponRepository.save(coupon));
    }

    /** Kết quả validate coupon. */
    public record ValidateResult(boolean valid, BigDecimal discountAmount, String code, String message) {
        static ValidateResult valid(BigDecimal discount, String code, String message) {
            return new ValidateResult(true, discount, code, message);
        }
        static ValidateResult invalid(String message) {
            return new ValidateResult(false, BigDecimal.ZERO, null, message);
        }
    }
}
