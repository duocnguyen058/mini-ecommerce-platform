package com.miniecommerce.catalog.product.specification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductSpecificationRepository extends JpaRepository<ProductSpecification, UUID> {
    List<ProductSpecification> findByProductIdOrderBySortOrderAsc(UUID productId);
    Optional<ProductSpecification> findByIdAndProductId(UUID id, UUID productId);
    void deleteByProductId(UUID productId);
}
