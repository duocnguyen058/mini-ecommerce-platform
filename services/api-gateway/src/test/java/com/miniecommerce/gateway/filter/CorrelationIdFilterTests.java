package com.miniecommerce.gateway.filter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;

class CorrelationIdFilterTests {

	private final CorrelationIdFilter filter = new CorrelationIdFilter();

	@Test
	void createsCorrelationIdWhenRequestDoesNotContainOne() {
		MockServerWebExchange exchange = MockServerWebExchange.from(
			MockServerHttpRequest.get("/api/products").build()
		);
		AtomicReference<ServerHttpRequest> forwardedRequest = new AtomicReference<>();
		GatewayFilterChain chain = forwardedExchange -> {
			forwardedRequest.set(forwardedExchange.getRequest());
			return forwardedExchange.getResponse().setComplete();
		};

		filter.filter(exchange, chain).block();

		String correlationId = forwardedRequest.get().getHeaders()
			.getFirst(CorrelationIdFilter.HEADER_NAME);
		assertThat(correlationId).isNotBlank();
		assertThat(exchange.getResponse().getHeaders()
			.getFirst(CorrelationIdFilter.HEADER_NAME))
			.isEqualTo(correlationId);
	}

	@Test
	void keepsExistingCorrelationId() {
		String existingId = "request-123";
		MockServerWebExchange exchange = MockServerWebExchange.from(
			MockServerHttpRequest.get("/api/products")
				.header(CorrelationIdFilter.HEADER_NAME, existingId)
				.build()
		);
		AtomicReference<ServerWebExchange> forwardedExchange = new AtomicReference<>();
		GatewayFilterChain chain = currentExchange -> {
			forwardedExchange.set(currentExchange);
			return currentExchange.getResponse().setComplete();
		};

		filter.filter(exchange, chain).block();

		assertThat(forwardedExchange.get().getRequest().getHeaders()
			.getFirst(CorrelationIdFilter.HEADER_NAME))
			.isEqualTo(existingId);
		assertThat(exchange.getResponse().getHeaders()
			.getFirst(CorrelationIdFilter.HEADER_NAME))
			.isEqualTo(existingId);
	}
}
