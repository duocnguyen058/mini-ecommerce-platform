package com.miniecommerce.catalog.category;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.miniecommerce.catalog.product.ProductRepository;

@Service
public class CategoryService {

	private final CategoryRepository categoryRepository;
	private final ProductRepository productRepository;

	public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
		this.categoryRepository = categoryRepository;
		this.productRepository = productRepository;
	}

	@Transactional(readOnly = true)
	public List<CategoryResponse> findAll() {
		return categoryRepository.findAllByOrderByNameAsc().stream()
			.map(c -> CategoryResponse.from(c, productRepository.countByCategoryId(c.getId())))
			.toList();
	}

	@Transactional
	public CategoryResponse create(CreateCategoryRequest request) {
		Category category = new Category(
			request.parentId(),
			request.name().trim(),
			request.slug().trim(),
			request.icon()
		);
		Category saved = categoryRepository.save(category);
		return CategoryResponse.from(saved, 0);
	}

	@Transactional
	public void delete(UUID id) {
		Category category = categoryRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục"));

		long productCount = productRepository.countByCategoryId(id);
		if (productCount > 0) {
			throw new ResponseStatusException(
				HttpStatus.BAD_REQUEST,
				"Không thể xóa danh mục '" + category.getName() + "' vì vẫn còn " + productCount + " sản phẩm đang liên kết."
			);
		}

		categoryRepository.delete(category);
	}
}
