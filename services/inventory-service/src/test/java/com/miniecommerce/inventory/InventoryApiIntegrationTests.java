package com.miniecommerce.inventory;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
class InventoryApiIntegrationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void rejectsRequestWithoutToken() throws Exception {
		mockMvc.perform(get("/api/inventory"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void adminCreatesStockAndCustomerCanReadIt() throws Exception {
		UUID productId = UUID.randomUUID();
		String createBody = """
			{
			  "productId": "%s",
			  "sku": "STOCK-INT-001",
			  "name": "Sản phẩm kiểm thử",
			  "quantityOnHand": 100,
			  "lowStockThreshold": 10
			}
			""".formatted(productId);

		mockMvc.perform(post("/api/admin/inventory")
				.with(admin())
				.contentType(MediaType.APPLICATION_JSON)
				.content(createBody))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.productId").value(productId.toString()))
			.andExpect(jsonPath("$.quantityOnHand").value(100))
			.andExpect(jsonPath("$.availableQuantity").value(100))
			.andExpect(jsonPath("$.status").value("IN_STOCK"));

		mockMvc.perform(get("/api/inventory/" + productId)
				.with(customer()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.sku").value("STOCK-INT-001"));
	}

	@Test
	void customerCannotCreateStock() throws Exception {
		String createBody = """
			{
			  "productId": "%s",
			  "sku": "STOCK-FORBIDDEN",
			  "name": "Sản phẩm",
			  "quantityOnHand": 10
			}
			""".formatted(UUID.randomUUID());

		mockMvc.perform(post("/api/admin/inventory")
				.with(customer())
				.contentType(MediaType.APPLICATION_JSON)
				.content(createBody))
			.andExpect(status().isForbidden());
	}

	@Test
	void adminAdjustsStockByDelta() throws Exception {
		UUID productId = UUID.randomUUID();
		createStock(productId, "STOCK-ADJ-001", 50);

		String adjustBody = "{ \"quantityDelta\": -20 }";
		mockMvc.perform(patch("/api/admin/inventory/" + productId + "/stock")
				.with(admin())
				.contentType(MediaType.APPLICATION_JSON)
				.content(adjustBody))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.quantityOnHand").value(30));
	}

	@Test
	void reserveThenConfirmReducesOnHand() throws Exception {
		UUID productId = UUID.randomUUID();
		createStock(productId, "STOCK-RES-001", 100);

		String reserveBody = """
			{
			  "productId": "%s",
			  "quantity": 30
			}
			""".formatted(productId);

		String reservationId = mockMvc.perform(post("/api/inventory/reserve")
				.with(customer())
				.contentType(MediaType.APPLICATION_JSON)
				.content(reserveBody))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("PENDING"))
			.andReturn().getResponse().getContentAsString();

		String id = reservationId.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

		mockMvc.perform(post("/api/inventory/reservations/" + id + "/confirm")
				.with(customer()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("CONFIRMED"));

		mockMvc.perform(get("/api/inventory/" + productId)
				.with(customer()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.quantityOnHand").value(70))
			.andExpect(jsonPath("$.quantityReserved").value(0));
	}

	@Test
	void reserveMoreThanAvailableReturns409() throws Exception {
		UUID productId = UUID.randomUUID();
		createStock(productId, "STOCK-RES-002", 5);

		String reserveBody = """
			{
			  "productId": "%s",
			  "quantity": 10
			}
			""".formatted(productId);

		mockMvc.perform(post("/api/inventory/reserve")
				.with(customer())
				.contentType(MediaType.APPLICATION_JSON)
				.content(reserveBody))
			.andExpect(status().isConflict());
	}

	private void createStock(UUID productId, String sku, int quantity) throws Exception {
		String createBody = """
			{
			  "productId": "%s",
			  "sku": "%s",
			  "name": "Sản phẩm",
			  "quantityOnHand": %d
			}
			""".formatted(productId, sku, quantity);
		mockMvc.perform(post("/api/admin/inventory")
				.with(admin())
				.contentType(MediaType.APPLICATION_JSON)
				.content(createBody))
			.andExpect(status().isCreated());
	}

	private static JwtRequestPostProcessor admin() {
		return jwt().jwt(jwt -> jwt.claim("roles", List.of("ROLE_ADMIN")))
			.authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
	}

	private static JwtRequestPostProcessor customer() {
		return jwt().jwt(jwt -> jwt.claim("roles", List.of("ROLE_CUSTOMER")))
			.authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
	}
}
