package com.miniecommerce.inventory.reservation;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

	Optional<Reservation> findByIdAndStatus(UUID id, ReservationStatus status);

	List<Reservation> findByOrderId(UUID orderId);

	List<Reservation> findByOrderIdAndStatus(UUID orderId, ReservationStatus status);

	List<Reservation> findByStatusAndExpiresAtBefore(ReservationStatus status, Instant now);
}
