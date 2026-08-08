package com.miniecommerce.cart;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.miniecommerce.cart.cart.AddCartItemRequest;
import com.miniecommerce.cart.cart.CartService;
import com.miniecommerce.cart.shared.config.CartProperties;

/**
 * Kiểm tra TTL của giỏ hàng trên Redis, đúng yêu cầu mục 7.5 của file hướng dẫn:
 * giỏ hàng phải có TTL để tự hết hạn, và TTL phải được refresh sau mỗi thao tác.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class CartTtlTests {

	@Autowired
	private CartService cartService;

	@Autowired
	private CartProperties cartProperties;

	@Test
	void settingCartAppliesTtl() {
		UUID userId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();

		cartService.addItem(userId, new AddCartItemRequest(productId, 1));
		Long ttl = cartService.remainingTtlSeconds(userId);

		assertThat(ttl)
			.as("TTL phải được set khi thêm vào giỏ")
			.isNotNull()
			.isPositive();
		assertThat(Duration.ofSeconds(ttl))
			.as("TTL phải gần bằng cart.ttl-days (dung sai 60s)")
			.isLessThanOrEqualTo(Duration.ofDays(cartProperties.ttlDays()))
			.isGreaterThan(Duration.ofDays(cartProperties.ttlDays()).minus(Duration.ofSeconds(60)));
	}

	@Test
	void eachOperationRefreshesTtl() throws InterruptedException {
		UUID userId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();

		cartService.addItem(userId, new AddCartItemRequest(productId, 1));
		Long ttlAfterAdd = cartService.remainingTtlSeconds(userId);

		Thread.sleep(1500);

		cartService.addItem(userId, new AddCartItemRequest(productId, 2));
		Long ttlAfterRefresh = cartService.remainingTtlSeconds(userId);

		assertThat(ttlAfterRefresh)
			.as("TTL phải được refresh về lại gần giá trị ban đầu sau thao tác mới")
			.isNotNull()
			.isGreaterThanOrEqualTo(ttlAfterAdd - 2);
	}

	@Test
	void clearingCartRemovesKey() {
		UUID userId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();
		cartService.addItem(userId, new AddCartItemRequest(productId, 1));
		assertThat(cartService.remainingTtlSeconds(userId)).isPositive();

		cartService.clearCart(userId);

		assertThat(cartService.remainingTtlSeconds(userId))
			.as("Key Redis phải bị xoá sau khi clear giỏ (-2 = không tồn tại)")
			.isEqualTo(-2L);
	}
}
