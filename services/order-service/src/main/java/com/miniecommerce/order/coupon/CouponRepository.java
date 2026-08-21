package com.miniecommerce.order.coupon;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CouponRepository extends JpaRepository<Coupon, UUID> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    @Query("SELECT c FROM Coupon c WHERE c.isActive = true AND (c.expiresAt IS NULL OR c.expiresAt > CURRENT_TIMESTAMP) AND c.usedCount < c.maxUsage")
    List<Coupon> findAllAvailable();
}
