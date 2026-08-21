package com.miniecommerce.order.order;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@EnableSpringDataWebSupport
public class OrderController {

	private final OrderService orderService;

	public OrderController(OrderService orderService) {
		this.orderService = orderService;
	}

	@GetMapping("/orders/{id}")
	ResponseEntity<OrderResponse> getById(@PathVariable UUID id, Authentication authentication) {
		return ResponseEntity.ok(orderService.getById(id, authentication));
	}

	@GetMapping("/orders")
	Page<OrderResponse> list(
		@RequestParam(name = "status", required = false) OrderStatus status,
		@RequestParam(name = "page", defaultValue = "0") int page,
		@RequestParam(name = "size", defaultValue = "20") int size,
		Authentication authentication
	) {
		Pageable pageable = PageRequest.of(page, Math.min(size, 100));
		return orderService.listMyOrders(status, authentication, pageable);
	}

	@GetMapping("/admin/orders")
	@PreAuthorize("hasRole('ADMIN')")
	Page<OrderResponse> listAdmin(
		@RequestParam(name = "status", required = false) OrderStatus status,
		@RequestParam(name = "page", defaultValue = "0") int page,
		@RequestParam(name = "size", defaultValue = "20") int size
	) {
		Pageable pageable = PageRequest.of(page, Math.min(size, 100));
		return orderService.listAdminOrders(status, pageable);
	}

	@GetMapping("/admin/orders/summary")
	@PreAuthorize("hasRole('ADMIN')")
	ResponseEntity<OrderSummaryResponse> getSummary() {
		return ResponseEntity.ok(orderService.getSummary());
	}


	/**
	 * Admin chuyển trạng thái đơn theo state machine.
	 * Service validate transition hợp lệ + side-effects (inventory reserve/confirm/cancel).
	 */
	@PatchMapping("/admin/orders/{id}/status")
	@PreAuthorize("hasRole('ADMIN')")
	ResponseEntity<OrderResponse> updateStatus(
		@PathVariable UUID id,
		@Valid @RequestBody UpdateOrderStatusRequest request,
		Authentication authentication
	) {
		return ResponseEntity.ok(orderService.updateStatus(id, request, authentication));
	}

	/**
	 * Customer huỷ đơn của chính mình — chỉ cho đơn PENDING/CONFIRMED/SHIPPING.
	 */
	@PostMapping("/orders/{id}/cancel")
	ResponseEntity<OrderResponse> customerCancel(
		@PathVariable UUID id,
		Authentication authentication
	) {
		return ResponseEntity.ok(orderService.customerCancel(id, authentication));
	}

	@PostMapping("/orders/{id}/return")
	ResponseEntity<OrderResponse> customerReturn(
		@PathVariable UUID id,
		Authentication authentication
	) {
		return ResponseEntity.ok(orderService.customerReturn(id, authentication));
	}
}
