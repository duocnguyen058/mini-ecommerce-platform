package com.miniecommerce.catalog.product;

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
	@Query("""
		select product
		from Product product
		where product.status = :status
		  and (lower(product.name) like lower(concat('%', :query, '%'))
		       or lower(product.sku) like lower(concat('%', :query, '%')))
		""")
	Page<Product> searchByStatusAndQuery(
		@Param("status") ProductStatus status,
		@Param("query") String query,
		Pageable pageable
	);

	@EntityGraph(attributePaths = "category")
	@Query("""
		select product
		from Product product
		where product.status = :status
		  and product.category.slug = :categorySlug
		  and (lower(product.name) like lower(concat('%', :query, '%'))
		       or lower(product.sku) like lower(concat('%', :query, '%')))
		""")
	Page<Product> searchByStatusQueryAndCategory(
		@Param("status") ProductStatus status,
		@Param("query") String query,
		@Param("categorySlug") String categorySlug,
		Pageable pageable
	);

	@EntityGraph(attributePaths = "category")
	Optional<Product> findByIdAndStatus(UUID id, ProductStatus status);
}
