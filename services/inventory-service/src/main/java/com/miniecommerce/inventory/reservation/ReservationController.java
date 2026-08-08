package com.miniecommerce.inventory.reservation;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class ReservationController {

	private final ReservationService reservationService;

	public ReservationController(ReservationService reservationService) {
		this.reservationService = reservationService;
	}

	@PostMapping("/reserve")
	ResponseEntity<ReservationResponse> reserve(@Valid @RequestBody ReserveRequest request) {
		ReservationResponse response = reservationService.reserve(request);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/reservations/{id}/confirm")
	ResponseEntity<ReservationResponse> confirm(@PathVariable UUID id) {
		return ResponseEntity.ok(reservationService.confirm(id));
	}

	@PostMapping("/reservations/{id}/cancel")
	ResponseEntity<ReservationResponse> cancel(@PathVariable UUID id) {
		return ResponseEntity.ok(reservationService.cancel(id));
	}
}
