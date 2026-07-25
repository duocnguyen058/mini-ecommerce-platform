package com.miniecommerce.catalog.product;

import java.util.Locale;
import java.util.UUID;

import com.miniecommerce.catalog.category.Category;
import com.miniecommerce.catalog.category.CategoryRepository;
import com.miniecommerce.catalog.shared.ResourceNotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

	private final ProductRepository productRepository;
	private final CategoryRepository categoryRepository;

	public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
		this.productRepository = productRepository;
		this.categoryRepository = categoryRepository;
	}

	@Transactional(readOnly = true)
	public Page<ProductResponse> findAll(String query, String categorySlug, Pageable pageable) {
		String normalizedQuery = normalize(query);
		String normalizedCategory = normalize(categorySlug);

		Page<Product> products;
		if (normalizedQuery == null && normalizedCategory == null) {
			products = productRepository.findByStatus(ProductStatus.ACTIVE, pageable);
		}
		else if (normalizedQuery == null) {
			products = productRepository.findByStatusAndCategory_Slug(
				ProductStatus.ACTIVE,
				normalizedCategory,
				pageable
			);
		}
		else if (normalizedCategory == null) {
			products = productRepository.searchByStatusAndQuery(
				ProductStatus.ACTIVE,
				normalizedQuery,
				pageable
			);
		}
		else {
			products = productRepository.searchByStatusQueryAndCategory(
				ProductStatus.ACTIVE,
				normalizedQuery,
				normalizedCategory,
				pageable
			);
		}

		return products.map(ProductResponse::from);
	}

	@Transactional(readOnly = true)
	public ProductResponse findById(UUID id) {
		return productRepository.findByIdAndStatus(id, ProductStatus.ACTIVE)
			.map(ProductResponse::from)
			.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm " + id));
	}

	@Transactional
	public ProductResponse create(CreateProductRequest request) {
		Category category = categoryRepository.findById(request.categoryId())
			.orElseThrow(() -> new ResourceNotFoundException(
				"Không tìm thấy danh mục " + request.categoryId()
			));

		ProductStatus status = request.status() == null ? ProductStatus.DRAFT : request.status();
		Product product = new Product(
			category,
			request.sku().trim().toUpperCase(Locale.ROOT),
			request.name().trim(),
			request.slug().trim(),
			normalize(request.description()),
			request.price(),
			status
		);

		return ProductResponse.from(productRepository.save(product));
	}

	private String normalize(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
