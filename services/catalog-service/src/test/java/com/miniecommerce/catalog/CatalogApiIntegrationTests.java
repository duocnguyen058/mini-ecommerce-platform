package com.miniecommerce.catalog;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
class CatalogApiIntegrationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void listsSeededProducts() throws Exception {
		mockMvc.perform(get("/api/products"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.content.length()").value(2))
			.andExpect(jsonPath("$.content[0].status").value("ACTIVE"));
	}

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
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", org.hamcrest.Matchers.startsWith("/api/products/")))
			.andExpect(jsonPath("$.sku").value("PHONE-TEST-001"))
			.andExpect(jsonPath("$.category.slug").value("dien-thoai"));
	}
}
