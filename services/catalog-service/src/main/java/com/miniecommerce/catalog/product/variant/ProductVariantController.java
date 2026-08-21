package com.miniecommerce.catalog.product.variant;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.miniecommerce.catalog.shared.ResourceNotFoundException;

@RestController
@RequestMapping("/api/v1/products/{productId}/variants")
public class ProductVariantController {

    private final ProductVariantRepository variantRepository;

    public ProductVariantController(ProductVariantRepository variantRepository) {
        this.variantRepository = variantRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductVariant>> getVariants(@PathVariable UUID productId) {
        return ResponseEntity.ok(variantRepository.findByProductIdOrderByCreatedAtAsc(productId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductVariant> createVariant(
            @PathVariable UUID productId,
            @RequestBody ProductVariant req
    ) {
        ProductVariant variant = new ProductVariant(
                productId,
                req.getSku(),
                req.getBarcode(),
                req.getName(),
                req.getPrice(),
                req.getOriginalPrice(),
                req.getImageUrl(),
                req.getStockQuantity(),
                req.getAttributesJson()
        );
        return ResponseEntity.ok(variantRepository.save(variant));
    }

    @DeleteMapping("/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVariant(
            @PathVariable UUID productId,
            @PathVariable UUID variantId
    ) {
        ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể của sản phẩm"));
        variantRepository.delete(variant);
        return ResponseEntity.noContent().build();
    }
}
