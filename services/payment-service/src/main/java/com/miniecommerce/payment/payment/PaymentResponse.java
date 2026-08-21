package com.miniecommerce.payment.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID orderId,
        PaymentMethod method,
        PaymentStatus status,
        BigDecimal amount,
        String currency,
        String appTransId,
        String zpTransId,
        String orderUrl,
        Instant createdAt,
        Instant updatedAt) {

    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getOrderId(),
                p.getMethod(),
                p.getStatus(),
                p.getAmount(),
                p.getCurrency(),
                p.getAppTransId(),
                p.getZpTransId(),
                p.getOrderUrl(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
