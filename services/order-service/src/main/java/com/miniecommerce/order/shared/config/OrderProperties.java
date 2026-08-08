package com.miniecommerce.order.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "clients")
public record OrderProperties(
	ClientConfig catalog,
	ClientConfig inventory,
	ClientConfig cart,
	OutboxConfig outbox
) {

	public record ClientConfig(String baseUrl) {
	}

	public record OutboxConfig(int pollIntervalMs, int batchSize) {
	}
}
