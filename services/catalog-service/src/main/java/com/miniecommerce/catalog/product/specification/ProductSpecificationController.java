package com.miniecommerce.catalog.product.specification;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.miniecommerce.catalog.shared.ResourceNotFoundException;

@RestController
@RequestMapping("/api/v1/products/{productId}/specs")
public class ProductSpecificationController {

    private final ProductSpecificationRepository specRepository;

    public ProductSpecificationController(ProductSpecificationRepository specRepository) {
        this.specRepository = specRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductSpecification>> getSpecifications(@PathVariable UUID productId) {
        return ResponseEntity.ok(specRepository.findByProductIdOrderBySortOrderAsc(productId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductSpecification> addSpecification(
            @PathVariable UUID productId,
            @RequestBody ProductSpecification req
    ) {
        ProductSpecification spec = new ProductSpecification(
                productId,
                req.getGroupName(),
                req.getSpecKey(),
                req.getSpecValue(),
                req.getSortOrder()
        );
        return ResponseEntity.ok(specRepository.save(spec));
    }

    @DeleteMapping("/{specId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSpecification(
            @PathVariable UUID productId,
            @PathVariable UUID specId
    ) {
        ProductSpecification spec = specRepository.findByIdAndProductId(specId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông số của sản phẩm"));
        specRepository.delete(spec);
        return ResponseEntity.noContent().build();
    }
}
