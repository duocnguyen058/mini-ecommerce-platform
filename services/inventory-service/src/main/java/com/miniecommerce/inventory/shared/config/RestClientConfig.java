package com.miniecommerce.inventory.shared.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * RestClient beans cho inter-service call từ inventory-service.
 * <p>
 * Hiện tại chỉ có {@code catalogRestClient} — dùng để verify productId trước khi tạo
 * inventory item. Không cần JWT (catalog public GET).
 */
@Configuration
public class RestClientConfig {

	@Value("${catalog-service.url:http://localhost:8082}")
	private String catalogServiceUrl;

	@Bean
	RestClient catalogRestClient() {
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout((int) Duration.ofSeconds(3).toMillis());
		factory.setReadTimeout((int) Duration.ofSeconds(3).toMillis());
		return RestClient.builder()
			.baseUrl(catalogServiceUrl)
			.requestFactory(factory)
			.build();
	}
}
