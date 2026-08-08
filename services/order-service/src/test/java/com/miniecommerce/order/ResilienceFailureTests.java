package com.miniecommerce.order;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.github.tomakehurst.wiremock.junit5.WireMockExtension;

import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;

/**
 * Test Resilience4j failure scenarios — inventory-service trả 500 (lỗi server) →
 * InventoryClient không retry (chỉ retry khi ResourceAccessException) → throw
 * RemoteServiceException → CheckoutService mark order CANCELLED, trả 503.
 * <p>
 * CircuitBreaker mở khi đủ số fail (theo application-test.yml: window=4, min=2,
 * threshold=50%). Test này không check circuit open trực tiếp (cần nhiều request) —
 * chỉ verify order CANCELLED khi inventory lỗi 5xx.
 */
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
class ResilienceFailureTests {

	@RegisterExtension
	static WireMockExtension catalogWire = WireMockExtension.newInstance()
		.options(WireMockConfiguration.wireMockConfig().dynamicPort())
		.failOnUnmatchedRequests(false)
		.build();

	@RegisterExtension
	static WireMockExtension inventoryWire = WireMockExtension.newInstance()
		.options(WireMockConfiguration.wireMockConfig().dynamicPort())
		.failOnUnmatchedRequests(false)
		.build();

	@RegisterExtension
	static WireMockExtension cartWire = WireMockExtension.newInstance()
		.options(WireMockConfiguration.wireMockConfig().dynamicPort())
		.failOnUnmatchedRequests(false)
		.build();

	@DynamicPropertySource
	static void registerClientUrls(DynamicPropertyRegistry registry) {
		registry.add("clients.catalog.base-url", () -> catalogWire.baseUrl());
		registry.add("clients.inventory.base-url", () -> inventoryWire.baseUrl());
		registry.add("clients.cart.base-url", () -> cartWire.baseUrl());
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private CircuitBreakerRegistry circuitBreakerRegistry;

	@BeforeEach
	void resetCircuit() {
		circuitBreakerRegistry.circuitBreaker("inventoryClient").reset();
		catalogWire.resetAll();
		inventoryWire.resetAll();
		cartWire.resetAll();
	}

	@Test
	void inventoryServerErrorCancelsOrder() throws Exception {
		UUID productId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();

		String cartBody = """
			{
			  "userId": "%s",
			  "items": [
			    {
			      "productId": "%s",
			      "sku": "stub",
			      "name": "stub",
			      "unitPrice": 100.0,
			      "quantity": 1
			    }
			  ]
			}
			""".formatted(userId, productId);
		cartWire.stubFor(WireMock.get(urlPathMatching("/api/cart/.*"))
			.willReturn(aResponse().withStatus(200)
				.withHeader("Content-Type", "application/json")
				.withBody(cartBody)));

		String productBody = """
			{
			  "id": "%s",
			  "sku": "SKU-FAIL",
			  "name": "Sản phẩm Fail",
			  "price": 100.0,
			  "status": "ACTIVE"
			}
			""".formatted(productId);
		catalogWire.stubFor(WireMock.get(urlPathMatching("/api/products/.*"))
			.willReturn(aResponse().withStatus(200)
				.withHeader("Content-Type", "application/json")
				.withBody(productBody)));

		inventoryWire.stubFor(WireMock.post(urlPathMatching("/api/inventory/reserve"))
			.willReturn(aResponse().withStatus(500)));

		mockMvc.perform(post("/api/checkout")
				.with(customerOf(userId))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isServiceUnavailable())
			.andExpect(jsonPath("$.status").value("CANCELLED"));
	}

	private static JwtRequestPostProcessor customerOf(UUID userId) {
		return jwt().jwt(jwt -> jwt.subject(userId.toString())
				.claim("roles", List.of("ROLE_CUSTOMER")))
			.authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
	}
}
