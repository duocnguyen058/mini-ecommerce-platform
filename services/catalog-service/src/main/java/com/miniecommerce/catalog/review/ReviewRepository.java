package com.miniecommerce.catalog.review;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<ProductReview, UUID> {

    Page<ProductReview> findByProductId(UUID productId, Pageable pageable);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.productId = :productId AND r.rating = :rating")
    long countByProductIdAndRating(@Param("productId") UUID productId, @Param("rating") int rating);

    List<ProductReview> findTop5ByProductIdOrderByCreatedAtDesc(UUID productId);
}
