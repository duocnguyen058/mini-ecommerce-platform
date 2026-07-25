package com.miniecommerce.catalog.category;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

	private final CategoryRepository categoryRepository;

	public CategoryService(CategoryRepository categoryRepository) {
		this.categoryRepository = categoryRepository;
	}

	@Transactional(readOnly = true)
	public List<CategoryResponse> findAll() {
		return categoryRepository.findAllByOrderByNameAsc().stream()
			.map(CategoryResponse::from)
			.toList();
	}

	@Transactional
	public CategoryResponse create(CreateCategoryRequest request) {
		Category category = new Category(request.name().trim(), request.slug().trim());
		return CategoryResponse.from(categoryRepository.save(category));
	}
}

