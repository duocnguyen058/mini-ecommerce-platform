package com.miniecommerce.inventory.reservation;

import java.time.Instant;
import java.util.UUID;

public record ReservationResponse(
	UUID id,
	UUID productId,
	UUID orderId,
	int quantity,
	ReservationStatus status,
	Instant expiresAt,
	Instant createdAt,
	Instant updatedAt
) {

	static ReservationResponse from(Reservation reservation) {
		return new ReservationResponse(
			reservation.getId(),
			reservation.getProductId(),
			reservation.getOrderId(),
			reservation.getQuantity(),
			reservation.getStatus(),
			reservation.getExpiresAt(),
			reservation.getCreatedAt(),
			reservation.getUpdatedAt()
		);
	}
}
