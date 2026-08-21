package com.miniecommerce.catalog.product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.miniecommerce.catalog.category.Category;
import com.miniecommerce.catalog.category.CategoryRepository;
import com.miniecommerce.catalog.shared.ResourceNotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
        return searchAdvanced(query, categorySlug, null, null, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchAdvanced(
            String query,
            String categorySlug,
            UUID brandId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            BigDecimal minRating,
            Pageable pageable
    ) {
        String normalizedQuery = normalize(query);
        String normalizedCategory = normalize(categorySlug);

        Page<Product> products = productRepository.searchAdvanced(
                ProductStatus.ACTIVE,
                normalizedQuery,
                normalizedCategory,
                brandId,
                minPrice,
                maxPrice,
                minRating,
                pageable
        );

        return products.map(ProductResponse::from);
    }

    @Transactional(readOnly = true)
    public List<String> getSuggestions(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return productRepository.findSearchSuggestions(query.trim(), PageRequest.of(0, 8));
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(UUID id) {
        return productRepository.findById(id)
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
                request.brandId(),
                request.sku().trim().toUpperCase(Locale.ROOT),
                request.name().trim(),
                request.slug().trim(),
                normalize(request.description()),
                request.price(),
                request.price(),
                0,
                normalize(request.imageUrl()),
                status
        );

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm " + id));

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy danh mục " + request.categoryId()
                    ));
            product.setCategory(category);
        }

        product.applyUpdates(
                request.name(),
                request.slug(),
                request.description(),
                request.price(),
                request.imageUrl(),
                request.status(),
                request.brandId()
        );
        return ProductResponse.from(productRepository.save(product));
    }


    @Transactional
    public void delete(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm " + id));
        productRepository.delete(product);
    }

    @Transactional
    public void bulkDelete(List<UUID> ids) {
        if (ids != null && !ids.isEmpty()) {
            productRepository.deleteAllById(ids);
        }
    }

    @Transactional
    public void bulkUpdateStatus(List<UUID> ids, ProductStatus status) {
        if (ids != null && status != null) {
            List<Product> products = productRepository.findAllById(ids);
            products.forEach(p -> p.setStatus(status));
            productRepository.saveAll(products);
        }
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}