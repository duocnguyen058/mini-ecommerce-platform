package com.miniecommerce.catalog.product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    @EntityGraph(attributePaths = "category")
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<Product> findByStatusAndCategory_Slug(
        ProductStatus status,
        String categorySlug,
        Pageable pageable
    );

    @EntityGraph(attributePaths = "category")
    @Query(
        value = """
            select p from Product p
            where (:status is null or p.status = :status)
              and (:query is null or :query = '' or lower(p.name) like lower(concat('%', :query, '%')) or lower(p.sku) like lower(concat('%', :query, '%')) or lower(p.barcode) like lower(concat('%', :query, '%')))
              and (:categorySlug is null or :categorySlug = '' or lower(p.category.slug) = lower(:categorySlug) or p.category.id in (select c.id from Category c where lower(c.slug) = lower(:categorySlug) or c.parentId in (select parent.id from Category parent where lower(parent.slug) = lower(:categorySlug))))
              and (:brandId is null or p.brandId = :brandId)
              and (:minPrice is null or p.price >= :minPrice)
              and (:maxPrice is null or p.price <= :maxPrice)
              and (:minRating is null or p.ratingAvg >= :minRating)
            """,
        countQuery = """
            select count(p) from Product p
            where (:status is null or p.status = :status)
              and (:query is null or :query = '' or lower(p.name) like lower(concat('%', :query, '%')) or lower(p.sku) like lower(concat('%', :query, '%')) or lower(p.barcode) like lower(concat('%', :query, '%')))
              and (:categorySlug is null or :categorySlug = '' or lower(p.category.slug) = lower(:categorySlug) or p.category.id in (select c.id from Category c where lower(c.slug) = lower(:categorySlug) or c.parentId in (select parent.id from Category parent where lower(parent.slug) = lower(:categorySlug))))
              and (:brandId is null or p.brandId = :brandId)
              and (:minPrice is null or p.price >= :minPrice)
              and (:maxPrice is null or p.price <= :maxPrice)
              and (:minRating is null or p.ratingAvg >= :minRating)
            """
    )
    Page<Product> searchAdvanced(
        @Param("status") ProductStatus status,
        @Param("query") String query,
        @Param("categorySlug") String categorySlug,
        @Param("brandId") UUID brandId,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("minRating") BigDecimal minRating,
        Pageable pageable
    );

    @Query("""
        select p.name from Product p
        where lower(p.name) like lower(concat('%', :query, '%'))
           or lower(p.sku) like lower(concat('%', :query, '%'))
        order by p.soldCount desc
        """)
    List<String> findSearchSuggestions(@Param("query") String query, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Optional<Product> findByIdAndStatus(UUID id, ProductStatus status);

    long countByBrandId(UUID brandId);

    @Query("select count(p) from Product p where p.category.id = :categoryId")
    long countByCategoryId(@Param("categoryId") UUID categoryId);
}

