package com.miniecommerce.cart;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
class CartApiIntegrationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void rejectsRequestWithoutToken() throws Exception {
		mockMvc.perform(get("/api/cart"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void addThenReadCart() throws Exception {
		UUID userId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();
		String addBody = """
			{
			  "productId": "%s",
			  "quantity": 2
			}
			""".formatted(productId);

		mockMvc.perform(post("/api/cart/items")
				.with(customer(userId))
				.contentType(MediaType.APPLICATION_JSON)
				.content(addBody))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.userId").value(userId.toString()))
			.andExpect(jsonPath("$.items[0].productId").value(productId.toString()))
			.andExpect(jsonPath("$.items[0].quantity").value(2))
			.andExpect(jsonPath("$.itemCount").value(2));

		mockMvc.perform(get("/api/cart").with(customer(userId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.itemCount").value(2));
	}

	@Test
	void addingSameProductAccumulatesQuantity() throws Exception {
		UUID userId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();
		addItem(userId, productId, 3);
		addItem(userId, productId, 2);

		mockMvc.perform(get("/api/cart").with(customer(userId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.items.length()").value(1))
			.andExpect(jsonPath("$.items[0].quantity").value(5))
			.andExpect(jsonPath("$.itemCount").value(5));
	}

	@Test
	void updateQuantityPersists() throws Exception {
		UUID userId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();
		addItem(userId, productId, 3);

		String patchBody = "{ \"quantity\": 7 }";
		mockMvc.perform(patch("/api/cart/items/" + productId)
				.with(customer(userId))
				.contentType(MediaType.APPLICATION_JSON)
				.content(patchBody))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.items[0].quantity").value(7));
	}

	@Test
	void settingQuantityToZeroRemovesItem() throws Exception {
		UUID userId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();
		addItem(userId, productId, 3);

		String patchBody = "{ \"quantity\": 0 }";
		mockMvc.perform(patch("/api/cart/items/" + productId)
				.with(customer(userId))
				.contentType(MediaType.APPLICATION_JSON)
				.content(patchBody))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.itemCount").value(0))
			.andExpect(jsonPath("$.items").isEmpty());
	}

	@Test
	void removeItemDeletesIt() throws Exception {
		UUID userId = UUID.randomUUID();
		UUID productIdA = UUID.randomUUID();
		UUID productIdB = UUID.randomUUID();
		addItem(userId, productIdA, 1);
		addItem(userId, productIdB, 2);

		mockMvc.perform(delete("/api/cart/items/" + productIdA).with(customer(userId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.items.length()").value(1))
			.andExpect(jsonPath("$.items[0].productId").value(productIdB.toString()));
	}

	@Test
	void clearCartEmptiesEverything() throws Exception {
		UUID userId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();
		addItem(userId, productId, 3);

		mockMvc.perform(delete("/api/cart").with(customer(userId)))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/cart").with(customer(userId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.itemCount").value(0))
			.andExpect(jsonPath("$.items").isEmpty());
	}

	private void addItem(UUID userId, UUID productId, int quantity) throws Exception {
		String body = """
			{
			  "productId": "%s",
			  "quantity": %d
			}
			""".formatted(productId, quantity);
		mockMvc.perform(post("/api/cart/items")
				.with(customer(userId))
				.contentType(MediaType.APPLICATION_JSON)
				.content(body))
			.andExpect(status().isOk());
	}

	private static JwtRequestPostProcessor customer(UUID userId) {
		return jwt().jwt(token -> token
				.subject(userId.toString())
				.claim("roles", List.of("ROLE_CUSTOMER")))
			.authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
	}
}
