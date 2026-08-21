package com.miniecommerce.catalog.product;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProductRequest(
        UUID categoryId,
        UUID brandId,
        @Size(max = 180) String name,
        @Size(max = 200)
        @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*",
                message = "Slug chỉ chứa chữ thường, số và dấu gạch ngang")
        String slug,
        @Size(max = 5000) String description,
        @DecimalMin(value = "0.00", message = "Giá phải >= 0") BigDecimal price,
        @Size(max = 500) String imageUrl,
        ProductStatus status
) {
}