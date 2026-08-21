package com.miniecommerce.catalog.product.unit;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductUnitRepository extends JpaRepository<ProductUnit, UUID> {
    List<ProductUnit> findByProductIdOrderByConversionRateAsc(UUID productId);
    Optional<ProductUnit> findByIdAndProductId(UUID id, UUID productId);
}
