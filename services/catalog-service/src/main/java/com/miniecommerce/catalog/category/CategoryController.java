package com.miniecommerce.catalog.category;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CategoryController {

	private final CategoryService categoryService;

	public CategoryController(CategoryService categoryService) {
		this.categoryService = categoryService;
	}

	@GetMapping("/categories")
	List<CategoryResponse> findAll() {
		return categoryService.findAll();
	}

	@PostMapping("/admin/categories")
	ResponseEntity<CategoryResponse> create(@Valid @RequestBody CreateCategoryRequest request) {
		CategoryResponse response = categoryService.create(request);
		return ResponseEntity
			.created(URI.create("/api/categories/" + response.id()))
			.body(response);
	}
}

