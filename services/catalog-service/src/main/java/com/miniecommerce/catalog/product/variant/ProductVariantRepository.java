package com.miniecommerce.catalog.product.variant;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    List<ProductVariant> findByProductIdOrderByCreatedAtAsc(UUID productId);
    Optional<ProductVariant> findByIdAndProductId(UUID id, UUID productId);
    boolean existsBySku(String sku);
}
