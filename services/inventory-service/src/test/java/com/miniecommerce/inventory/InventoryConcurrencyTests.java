package com.miniecommerce.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.miniecommerce.inventory.stock.InventoryItem;
import com.miniecommerce.inventory.stock.InventoryItemRepository;

/**
 * Chứng minh cơ chế optimistic lock giữ an toàn dữ liệu khi có nhiều request giữ
 * hàng đồng thời: tổng số lượng giữ thành công không bao giờ vượt số tồn khả dụng.
 * Đây là yêu cầu bắt buộc ở mục 7.4 của file hướng dẫn.
 */
@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
class InventoryConcurrencyTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private InventoryItemRepository inventoryItemRepository;

	@Test
	void concurrentReservationsNeverExceedAvailableStock() throws Exception {
		int totalOnHand = 10;
		int requestPerReservation = 1;
		int concurrentRequests = 50;
		int maxAllowedSuccess = totalOnHand / requestPerReservation;

		UUID productId = UUID.randomUUID();
		createStock(productId, "STOCK-CONC-001", totalOnHand);

		ThreadPoolExecutor executor = (ThreadPoolExecutor) Executors.newFixedThreadPool(concurrentRequests);
		try {
			List<CompletableFuture<Boolean>> futures = new ArrayList<>();
			for (int i = 0; i < concurrentRequests; i++) {
				futures.add(CompletableFuture.supplyAsync(() -> tryReserve(productId), executor));
			}
			CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

			long successes = futures.stream()
				.map(future -> future.join())
				.filter(result -> Boolean.TRUE.equals(result))
				.count();
			InventoryItem item = inventoryItemRepository.findByProductId(productId).orElseThrow();

			assertThat(successes)
				.as("Số reserve thành công không vượt quá giới hạn tồn")
				.isLessThanOrEqualTo(maxAllowedSuccess);
			assertThat(item.getQuantityReserved())
				.as("quantityReserved trong DB phải khớp với số thành công")
				.isEqualTo((int) successes * requestPerReservation);
			assertThat(item.getQuantityReserved())
				.as("Tồn đã giữ không vượt tồn thực")
				.isLessThanOrEqualTo(item.getQuantityOnHand());
		}
		finally {
			executor.shutdownNow();
		}
	}

	private boolean tryReserve(UUID productId) {
		String body = """
			{
			  "productId": "%s",
			  "quantity": 1
			}
			""".formatted(productId);
		try {
			MvcResult result = mockMvc.perform(post("/api/inventory/reserve")
					.with(customer())
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
				.andReturn();
			return result.getResponse().getStatus() == 200;
		}
		catch (Exception exception) {
			throw new RuntimeException(exception);
		}
	}

	private void createStock(UUID productId, String sku, int quantity) throws Exception {
		String createBody = """
			{
			  "productId": "%s",
			  "sku": "%s",
			  "name": "Sản phẩm concurrent",
			  "quantityOnHand": %d
			}
			""".formatted(productId, sku, quantity);
		mockMvc.perform(post("/api/admin/inventory")
				.with(admin())
				.contentType(MediaType.APPLICATION_JSON)
				.content(createBody))
			.andExpect(status().isCreated());
	}

	private static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor admin() {
		return jwt().jwt(jwt -> jwt.claim("roles", java.util.List.of("ROLE_ADMIN")))
			.authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));
	}

	private static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor customer() {
		return jwt().jwt(jwt -> jwt.claim("roles", java.util.List.of("ROLE_CUSTOMER")))
			.authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_CUSTOMER"));
	}
}
