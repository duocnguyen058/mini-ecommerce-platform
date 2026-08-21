package com.miniecommerce.catalog.product.unit;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.miniecommerce.catalog.shared.ResourceNotFoundException;

@RestController
@RequestMapping("/api/v1/products/{productId}/units")
public class ProductUnitController {

    private final ProductUnitRepository unitRepository;

    public ProductUnitController(ProductUnitRepository unitRepository) {
        this.unitRepository = unitRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductUnit>> getUnits(@PathVariable UUID productId) {
        return ResponseEntity.ok(unitRepository.findByProductIdOrderByConversionRateAsc(productId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductUnit> addUnit(
            @PathVariable UUID productId,
            @RequestBody ProductUnit req
    ) {
        ProductUnit unit = new ProductUnit(
                productId,
                req.getUnitName(),
                req.getConversionRate(),
                req.getSku(),
                req.getBarcode(),
                req.getPrice(),
                req.getStockQuantity()
        );
        return ResponseEntity.ok(unitRepository.save(unit));
    }

    @DeleteMapping("/{unitId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUnit(
            @PathVariable UUID productId,
            @PathVariable UUID unitId
    ) {
        ProductUnit unit = unitRepository.findByIdAndProductId(unitId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn vị bán của sản phẩm"));
        unitRepository.delete(unit);
        return ResponseEntity.noContent().build();
    }
}
