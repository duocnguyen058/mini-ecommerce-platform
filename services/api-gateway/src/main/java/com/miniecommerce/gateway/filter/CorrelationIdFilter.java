package com.miniecommerce.gateway.filter;

import java.util.UUID;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {

	public static final String HEADER_NAME = "X-Correlation-Id";

	@Override
	public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
		String correlationId = exchange.getRequest().getHeaders().getFirst(HEADER_NAME);
		if (correlationId == null || correlationId.isBlank()) {
			correlationId = UUID.randomUUID().toString();
		}

		String finalCorrelationId = correlationId;
		ServerWebExchange mutatedExchange = exchange.mutate()
			.request(request -> request.headers(headers -> headers.set(
				HEADER_NAME,
				finalCorrelationId
			)))
			.build();

		mutatedExchange.getResponse().getHeaders().set(HEADER_NAME, finalCorrelationId);
		return chain.filter(mutatedExchange);
	}

	@Override
	public int getOrder() {
		return Ordered.HIGHEST_PRECEDENCE;
	}
}

