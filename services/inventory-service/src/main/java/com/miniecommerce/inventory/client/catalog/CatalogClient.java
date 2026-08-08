package com.miniecommerce.inventory.client.catalog;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

/**
 * Client gọi catalog-service để verify productId có tồn tại không.
 * <p>
 * Không cần JWT — catalog public GET products. Timeout 3s.
 */
@Component
public class CatalogClient {

	private final RestClient catalogRestClient;

	public CatalogClient(@Qualifier("catalogRestClient") RestClient catalogRestClient) {
		this.catalogRestClient = catalogRestClient;
	}

	/**
	 * Verify productId có tồn tại trong catalog-service.
	 * Trả true nếu tồn tại; false nếu 404 hoặc lỗi.
	 */
	public boolean existsProduct(UUID productId) {
		try {
			catalogRestClient.get()
				.uri("/api/products/{id}", productId)
				.retrieve()
				.toBodilessEntity();
			return true;
		}
		catch (HttpClientErrorException.NotFound ex) {
			return false;
		}
		catch (Exception ex) {
			// Lỗi mạng / timeout → fail-closed (coi như không tồn tại).
			return false;
		}
	}
}
