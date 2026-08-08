package com.miniecommerce.catalog;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
class CatalogApiIntegrationTests {

	@Autowired
	private MockMvc mockMvc;

	// ----------------- JWT helper -----------------

	private static JwtRequestPostProcessor adminOf() {
		return jwt().jwt(jwt -> jwt.claim("roles", List.of("ROLE_ADMIN")))
			.authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
	}

	private static JwtRequestPostProcessor customerOf() {
		return jwt().jwt(jwt -> jwt.claim("roles", List.of("ROLE_CUSTOMER")))
			.authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
	}

	// ----------------- Public read (auth required nhưng không cần ADMIN) -----------------

	@Test
	void listsSeededProducts() throws Exception {
		mockMvc.perform(get("/api/products").with(customerOf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.content.length()").value(2))
			.andExpect(jsonPath("$.content[0].status").value("ACTIVE"));
	}

	@Test
	void rejectsRequestWithoutJwt() throws Exception {
		mockMvc.perform(get("/api/products"))
			.andExpect(status().isUnauthorized());
	}

	// ----------------- Create -----------------

	@Test
	void createsProduct() throws Exception {
		String request = """
			{
			  "categoryId": "11111111-1111-1111-1111-111111111111",
			  "sku": "PHONE-TEST-001",
			  "name": "Điện thoại kiểm thử",
			  "slug": "dien-thoai-kiem-thu",
			  "description": "Sản phẩm được tạo bởi integration test.",
			  "price": 12990000,
			  "status": "ACTIVE"
			}
			""";

		mockMvc.perform(post("/api/admin/products")
				.with(adminOf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", org.hamcrest.Matchers.startsWith("/api/products/")))
			.andExpect(jsonPath("$.sku").value("PHONE-TEST-001"))
			.andExpect(jsonPath("$.category.slug").value("dien-thoai"));
	}

	@Test
	void nonAdminCannotCreateProduct() throws Exception {
		String request = """
			{
			  "categoryId": "11111111-1111-1111-1111-111111111111",
			  "sku": "PHONE-FORBIDDEN",
			  "name": "No-no",
			  "slug": "no-no",
			  "price": 1000,
			  "status": "ACTIVE"
			}
			""";
		mockMvc.perform(post("/api/admin/products")
				.with(customerOf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isForbidden());
	}

	// ----------------- Update (PUT) -----------------

	@Test
	void adminUpdatesProduct() throws Exception {
		// Tạo sản phẩm trước để có id hợp lệ.
		String createRequest = """
			{
			  "categoryId": "11111111-1111-1111-1111-111111111111",
			  "sku": "UPDATE-001",
			  "name": "Trước update",
			  "slug": "truoc-update",
			  "price": 1000000,
			  "status": "DRAFT"
			}
			""";
		String createdJson = mockMvc.perform(post("/api/admin/products")
				.with(adminOf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(createRequest))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		String id = extractId(createdJson);

		// Update name + price + status, giữ SKU + category.
		String updateRequest = """
			{
			  "name": "Sau update",
			  "price": 2000000,
			  "status": "ACTIVE",
			  "description": "Mô tả mới"
			}
			""";
		mockMvc.perform(put("/api/admin/products/" + id)
				.with(adminOf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateRequest))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(id))
			.andExpect(jsonPath("$.name").value("Sau update"))
			.andExpect(jsonPath("$.price").value(2000000.0))
			.andExpect(jsonPath("$.status").value("ACTIVE"))
			.andExpect(jsonPath("$.description").value("Mô tả mới"))
			.andExpect(jsonPath("$.sku").value("UPDATE-001")); // SKU giữ nguyên
	}

	@Test
	void nonAdminCannotUpdateProduct() throws Exception {
		String updateRequest = """
			{ "name": "Hack attempt", "price": 1 }
			""";
		// ID không tồn tại — quan trọng là 403, không phải 404.
		mockMvc.perform(put("/api/admin/products/" + UUID.randomUUID())
				.with(customerOf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateRequest))
			.andExpect(status().isForbidden());
	}

	@Test
	void updateProductReturns404WhenNotFound() throws Exception {
		String updateRequest = """
			{ "name": "Ghost" }
			""";
		mockMvc.perform(put("/api/admin/products/" + UUID.randomUUID())
				.with(adminOf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateRequest))
			.andExpect(status().isNotFound());
	}

	@Test
	void updateProductReturns400OnInvalidSlug() throws Exception {
		String updateRequest = """
			{ "slug": "Slug Có Dấu Cách Và HOA" }
			""";
		mockMvc.perform(put("/api/admin/products/" + UUID.randomUUID())
				.with(adminOf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateRequest))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors").isArray());
	}

	// ----------------- Delete -----------------

	@Test
	void adminDeletesProduct() throws Exception {
		String createRequest = """
			{
			  "categoryId": "11111111-1111-1111-1111-111111111111",
			  "sku": "DELETE-001",
			  "name": "Sẽ xoá",
			  "slug": "se-xoa",
			  "price": 500000,
			  "status": "DRAFT"
			}
			""";
		String createdJson = mockMvc.perform(post("/api/admin/products")
				.with(adminOf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(createRequest))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		String id = extractId(createdJson);

		mockMvc.perform(delete("/api/admin/products/" + id).with(adminOf()))
			.andExpect(status().isNoContent());

		// GET lại → 404 (vì public findById chỉ thấy ACTIVE; product đã bị xoá nên 404).
		mockMvc.perform(get("/api/products/" + id).with(customerOf()))
			.andExpect(status().isNotFound());
	}

	@Test
	void nonAdminCannotDeleteProduct() throws Exception {
		mockMvc.perform(delete("/api/admin/products/" + UUID.randomUUID()).with(customerOf()))
			.andExpect(status().isForbidden());
	}

	@Test
	void deleteProductReturns404WhenNotFound() throws Exception {
		mockMvc.perform(delete("/api/admin/products/" + UUID.randomUUID()).with(adminOf()))
			.andExpect(status().isNotFound());
	}

	private static String extractId(String json) {
		// JSON đơn giản từ ProductResponse — chỉ cần trích "id":"<uuid>".
		int idx = json.indexOf("\"id\":\"") + 6;
		int end = json.indexOf("\"", idx);
		return json.substring(idx, end);
	}
}
