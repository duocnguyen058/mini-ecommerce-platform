package com.miniecommerce.catalog.product;

import java.net.URI;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ProductController {

	private final ProductService productService;

	public ProductController(ProductService productService) {
		this.productService = productService;
	}

	@GetMapping("/products")
	Page<ProductResponse> findAll(
		@RequestParam(required = false) String q,
		@RequestParam(required = false) String category,
		@PageableDefault(size = 20, sort = "createdAt") Pageable pageable
	) {
		return productService.findAll(q, category, pageable);
	}

	@GetMapping("/products/{id}")
	ProductResponse findById(@PathVariable UUID id) {
		return productService.findById(id);
	}

	@PostMapping("/admin/products")
	ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest request) {
		ProductResponse response = productService.create(request);
		return ResponseEntity
			.created(URI.create("/api/products/" + response.id()))
			.body(response);
	}
}

