package com.miniecommerce.inventory.stock;

import java.net.URI;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping("/inventory")
    Page<InventoryItemResponse> findAll(@PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return stockService.findAll(pageable);
    }

    @GetMapping("/inventory/{productId}")
    InventoryItemResponse findByProductId(@PathVariable UUID productId) {
        return stockService.findByProductId(productId);
    }

    @GetMapping("/admin/inventory")
    @PreAuthorize("hasRole('ADMIN')")
    Page<InventoryItemResponse> adminFindAll(@PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return stockService.findAll(pageable);
    }

    @GetMapping("/admin/inventory/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    InventoryItemResponse adminFindByProductId(@PathVariable UUID productId) {
        return stockService.findByProductId(productId);
    }

    @PostMapping("/admin/inventory")
    @PreAuthorize("hasRole('ADMIN')")
    ResponseEntity<InventoryItemResponse> create(@Valid @RequestBody CreateInventoryItemRequest request) {
        InventoryItemResponse response = stockService.create(request);
        return ResponseEntity.created(URI.create("/api/inventory/" + response.productId())).body(response);
    }

    @PatchMapping("/admin/inventory/{productId}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    InventoryItemResponse adjustStock(@PathVariable UUID productId, @Valid @RequestBody AdjustStockRequest request) {
        return stockService.adjustStock(productId, request.quantityDelta());
    }

    @PatchMapping("/inventory/{productId}/stock")
    InventoryItemResponse adjustStockInternal(@PathVariable UUID productId, @Valid @RequestBody AdjustStockRequest request) {
        return stockService.adjustStock(productId, request.quantityDelta());
    }
}
