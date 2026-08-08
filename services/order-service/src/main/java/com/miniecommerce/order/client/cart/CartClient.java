package com.miniecommerce.order.client.cart;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.miniecommerce.order.shared.exception.RemoteServiceException;
import com.miniecommerce.order.shared.exception.ResourceNotFoundException;

/**
 * Client gọi cart-service để lấy/xóa giỏ hàng lúc checkout.
 * <p>
 * JWT được forward tự động qua interceptor trong {@code RestClientConfig}
 * (lấy {@code Authorization} từ request hiện tại qua {@code RequestContextHolder}).
 * <p>
 * Lưu ý: cart-service lưu theo {@code userId} (lấy từ JWT sub ở cart-service),
 * nên truyền {@code userId} vào URL.
 */
@Component
public class CartClient {

	private final RestClient cartRestClient;

	public CartClient(@Qualifier("cartRestClient") RestClient cartRestClient) {
		// RestClient bean "cartRestClient" injections theo tên (xem RestClientConfig).
		this.cartRestClient = cartRestClient;
	}

	/** Lấy snapshot giỏ hàng của user (auth = user qua JWT). 404 → coi như giỏ rỗng. */
	public CartSnapshot fetchCart(UUID userId) {
		try {
			return cartRestClient.get()
				.uri("/api/cart")
				.retrieve()
				.onStatus(status -> status.value() == 404,
					(request, response) -> {
						throw new ResourceNotFoundException("Giỏ hàng không tồn tại: " + userId);
					})
				.onStatus(status -> status.isError(),
					(request, response) -> {
						throw new RemoteServiceException(
							"cart-service lỗi " + response.getStatusCode().value(),
							response.getStatusCode().value());
					})
				.body(CartSnapshot.class);
		}
		catch (ResourceNotFoundException ex) {
			// Không có giỏ → trả cart rỗng; CheckoutService sẽ tự reject (đơn không có item).
			return new CartSnapshot(userId, java.util.List.of());
		}
	}

	/**
	 * Xóa giỏ hàng sau khi đơn CONFIRMED — fire-and-forget.
	 * Bắt exception để lỗi xóa cart không rollback đơn đã confirm.
	 * (Thực tế: cart sẽ hết hạn tự động theo TTL trong Redis.)
	 */
	public void clearCart(UUID userId) {
		try {
			cartRestClient.delete()
				.uri("/api/cart")
				.retrieve()
				.toBodilessEntity();
		}
		catch (Exception ex) {
			// bỏ qua — không propagating để không rollback đơn đã CONFIRMED.
		}
	}
}
