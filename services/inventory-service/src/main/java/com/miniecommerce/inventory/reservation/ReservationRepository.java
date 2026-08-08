package com.miniecommerce.inventory.reservation;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

	Optional<Reservation> findByIdAndStatus(UUID id, ReservationStatus status);
}
