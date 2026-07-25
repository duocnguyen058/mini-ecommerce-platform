package com.miniecommerce.catalog.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
	@NotBlank @Size(max = 120) String name,
	@NotBlank
	@Size(max = 140)
	@Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*") String slug
) {
}

