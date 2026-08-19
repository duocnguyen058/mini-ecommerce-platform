package com.miniecommerce.catalog.category;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
	UUID parentId,
	@NotBlank @Size(max = 120) String name,
	@NotBlank
	@Size(max = 140)
	@Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*") String slug,
	String icon
) {
}
