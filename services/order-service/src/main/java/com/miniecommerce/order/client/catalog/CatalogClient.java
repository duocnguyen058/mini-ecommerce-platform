package com.miniecommerce.order.client.catalog;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.miniecommerce.order.shared.exception.RemoteServiceException;
import com.miniecommerce.order.shared.exception.ResourceNotFoundException;

/**
 * Client gọi catalog-service để snapshot thông tin sản phẩm lúc checkout.
 * <p>
 * JWT được forward tự động qua interceptor trong {@code RestClientConfig}
 * (lấy {@code Authorization} từ request hiện tại qua {@code RequestContextHolder}).
 */
@Component
public class CatalogClient {

	private final RestClient catalogRestClient;

	public CatalogClient(@Qualifier("catalogRestClient") RestClient catalogRestClient) {
		this.catalogRestClient = catalogRestClient;
	}

	/**
	 * Lấy snapshot sản phẩm. Bắn {@link ResourceNotFoundException} nếu 404,
	 * {@link RemoteServiceException} nếu lỗi khác.
	 */
	public ProductSnapshot fetchProduct(UUID productId) {
		return catalogRestClient.get()
			.uri("/api/products/{id}", productId)
			.retrieve()
			.onStatus(status -> status.value() == 404,
				(request, response) -> {
					throw new ResourceNotFoundException(
						"Sản phẩm không tồn tại: " + productId);
				})
			.onStatus(status -> status.isError(),
				(request, response) -> {
					throw new RemoteServiceException(
						"catalog-service lỗi " + response.getStatusCode().value(),
						response.getStatusCode().value());
				})
			.body(ProductSnapshot.class);
	}

	/**
	 * Snapshot sản phẩm — chỉ lấy những trường cần để chốt đơn.
	 * {@code status} quyết định có cho phép đặt (chỉ ACTIVE).
	 */
	public record ProductSnapshot(
		UUID id,
		String sku,
		String name,
		BigDecimal price,
		String status,
		Instant createdAt,
		Instant updatedAt
	) {

		/** Trả về true nếu status == "ACTIVE" (chấp nhận đặt). */
		public boolean isActive() {
			return "ACTIVE".equalsIgnoreCase(status);
		}
	}
}
