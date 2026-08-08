package com.miniecommerce.catalog.product;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body PUT /api/admin/products/{id}.
 * <p>
 * Mọi field optional — null nghĩa là "giữ nguyên". SKU + categoryId là định danh
 * nên KHÔNG đổi được qua endpoint này (FE cũng không cho phép sửa).
 * <p>
 * Validation chỉ chạy khi field != null — nhờ vậy có thể gửi body rỗng để
 * "no-op" update, hoặc chỉ sửa 1-2 field.
 */
public record UpdateProductRequest(
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