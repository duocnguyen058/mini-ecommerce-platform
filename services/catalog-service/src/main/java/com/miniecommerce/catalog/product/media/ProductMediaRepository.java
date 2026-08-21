package com.miniecommerce.catalog.product.media;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductMediaRepository extends JpaRepository<ProductMedia, UUID> {
    List<ProductMedia> findByProductIdOrderBySortOrderAsc(UUID productId);
    List<ProductMedia> findByVariantIdOrderBySortOrderAsc(UUID variantId);
    Optional<ProductMedia> findByIdAndProductId(UUID id, UUID productId);
    void deleteByProductId(UUID productId);
}
