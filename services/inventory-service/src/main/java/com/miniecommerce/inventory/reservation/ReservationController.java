package com.miniecommerce.inventory.reservation;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
	@PreAuthorize("hasAnyRole('ADMIN', 'SERVICE')")
	ResponseEntity<ReservationResponse> reserve(@Valid @RequestBody ReserveRequest request) {
		ReservationResponse response = reservationService.reserve(request);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/orders/{orderId}/confirm")
	@PreAuthorize("hasAnyRole('ADMIN', 'SERVICE')")
	ResponseEntity<Void> confirmByOrderId(@PathVariable UUID orderId) {
		reservationService.confirmByOrderId(orderId);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/orders/{orderId}/cancel")
	@PreAuthorize("hasAnyRole('ADMIN', 'SERVICE')")
	ResponseEntity<Void> cancelByOrderId(@PathVariable UUID orderId) {
		reservationService.cancelByOrderId(orderId);
		return ResponseEntity.ok().build();
	}
}
