package com.miniecommerce.order;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.test.web.servlet.MvcResult;

import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.github.tomakehurst.wiremock.junit5.WireMockExtension;

import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;

/**
 * Integration test cho POST /api/checkout — dùng WireMock stub 3 service phụ
 * (catalog/inventory/cart) + Testcontainers (PostgreSQL + RabbitMQ) qua
 * {@link TestcontainersConfiguration}.
 * <p>
 * Các kịch bản:
 * <ul>
 *   <li>happy path: cart có 1 item, catalog trả sản phẩm ACTIVE, inventory reserve+confirm 200
 *       → order CONFIRMED, cart bị xóa.</li>
 *   <li>product không ACTIVE → 400 (InvalidOrderRequestException).</li>
 *   <li>inventory reserve 409 → order REJECTED (409).</li>
 *   <li>idempotency: gọi 2 lần cùng Idempotency-Key → trả cùng order id.</li>
 * </ul>
 */
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
class CheckoutApiIntegrationTests {

	/** WireMock cho catalog-service (port động). */
	@RegisterExtension
	static WireMockExtension catalogWire = WireMockExtension.newInstance()
		.options(WireMockConfiguration.wireMockConfig().dynamicPort())
		.failOnUnmatchedRequests(false)
		.build();

	/** WireMock cho inventory-service. */
	@RegisterExtension
	static WireMockExtension inventoryWire = WireMockExtension.newInstance()
		.options(WireMockConfiguration.wireMockConfig().dynamicPort())
		.failOnUnmatchedRequests(false)
		.build();

	/** WireMock cho cart-service. */
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
		// Reset CircuitBreaker giữa các test để không leak state (open) từ test trước.
		circuitBreakerRegistry.circuitBreaker("inventoryClient").reset();
		// Xóa stub WireMock cũ để test sau set lại sạch.
		catalogWire.resetAll();
		inventoryWire.resetAll();
		cartWire.resetAll();
	}

	@Test
	void rejectsRequestWithoutToken() throws Exception {
		mockMvc.perform(post("/api/checkout")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void checkoutCreatesPendingOrder() throws Exception {
		UUID productId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();

		stubCartGetOne(userId, productId);
		stubCatalogGet(productId, "SKU-001", "Sản phẩm A", 100.0, "ACTIVE");

		// Flow mới: checkout không reserve inventory — đơn ở PENDING, chờ admin duyệt.
		mockMvc.perform(post("/api/checkout")
				.with(customerOf(userId))
				.header("Idempotency-Key", "happy-key-" + UUID.randomUUID())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isAccepted())
			.andExpect(jsonPath("$.status").value("PENDING"))
			.andExpect(jsonPath("$.items[0].sku").value("SKU-001"))
			.andExpect(jsonPath("$.items[0].unitPrice").value(100.0))
			.andExpect(jsonPath("$.items[0].lineTotal").value(100.0))
			.andExpect(jsonPath("$.totalAmount").value(100.0))
			.andExpect(jsonPath("$.currency").value("VND"));
	}

	@Test
	void checkoutRejectsWhenProductInactive() throws Exception {
		UUID productId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();

		stubCartGetOne(userId, productId);
		stubCatalogGet(productId, "SKU-INACTIVE", "Sản phẩm B", 50.0, "INACTIVE");

		mockMvc.perform(post("/api/checkout")
				.with(customerOf(userId))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void idempotencyReplayReturnsSameOrderId() throws Exception {
		UUID productId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		String idempotencyKey = "idem-" + UUID.randomUUID();

		stubCartGetOne(userId, productId);
		stubCatalogGet(productId, "SKU-IDEM", "Sản phẩm D", 80.0, "ACTIVE");

		MvcResult first = mockMvc.perform(post("/api/checkout")
				.with(customerOf(userId))
				.header("Idempotency-Key", idempotencyKey)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isAccepted())
			.andReturn();
		String orderId = first.getResponse().getContentAsString()
			.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

		mockMvc.perform(post("/api/checkout")
				.with(customerOf(userId))
				.header("Idempotency-Key", idempotencyKey)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isAccepted())
			.andExpect(jsonPath("$.id").value(orderId));
	}

	@Test
	void getOwnOrderReturnsOk() throws Exception {
		UUID productId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();

		stubCartGetOne(userId, productId);
		stubCatalogGet(productId, "SKU-GET", "Sản phẩm E", 120.0, "ACTIVE");

		MvcResult result = mockMvc.perform(post("/api/checkout")
				.with(customerOf(userId))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
			.andExpect(status().isAccepted())
			.andReturn();
		String orderId = result.getResponse().getContentAsString()
			.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

		mockMvc.perform(get("/api/orders/" + orderId)
				.with(customerOf(userId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(orderId))
			.andExpect(jsonPath("$.status").value("PENDING"));
	}

	// ----------------- stub helpers (WireMock tường minh để tránh xung đột static import) -----------------

	private void stubCartGetOne(UUID userId, UUID productId) {
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
			.willReturn(aResponse()
				.withStatus(200)
				.withHeader("Content-Type", "application/json")
				.withBody(cartBody)));
	}

	private void stubCatalogGet(UUID productId, String sku, String name, double price, String status) {
		String body = """
			{
			  "id": "%s",
			  "sku": "%s",
			  "name": "%s",
			  "price": %s,
			  "status": "%s"
			}
			""".formatted(productId, sku, name, price, status);
		catalogWire.stubFor(WireMock.get(urlPathMatching("/api/products/.*"))
			.willReturn(aResponse()
				.withStatus(200)
				.withHeader("Content-Type", "application/json")
				.withBody(body)));
	}

	// ----------------- JWT helper (theo pattern inventory-service) -----------------

	private static JwtRequestPostProcessor customerOf(UUID userId) {
		return jwt().jwt(jwt -> jwt.subject(userId.toString())
				.claim("roles", List.of("ROLE_CUSTOMER")))
			.authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
	}
}
