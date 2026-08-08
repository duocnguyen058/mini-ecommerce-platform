package com.miniecommerce.cart.cart;

import java.time.Duration;
import java.util.UUID;

import com.miniecommerce.cart.shared.config.CartProperties;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class CartService {

	static final Duration CART_TTL = Duration.ofDays(7);

	private final RedisTemplate<String, Cart> cartRedisTemplate;
	private final Duration ttl;

	public CartService(RedisTemplate<String, Cart> cartRedisTemplate, CartProperties cartProperties) {
		this.cartRedisTemplate = cartRedisTemplate;
		this.ttl = Duration.ofDays(cartProperties.ttlDays());
	}

	/**
	 * Đọc giỏ hàng của người dùng. Trả về giỏ rỗng nếu chưa có trong Redis nhằm giữ
	 * API ổn định cho frontend; Redis thực sự không lưu key cho giỏ rỗng.
	 */
	public CartResponse getCart(UUID userId) {
		Cart cart = cartRedisTemplate.opsForValue().get(key(userId));
		return cart == null ? CartResponse.empty(userId) : CartResponse.from(cart);
	}

	public CartResponse addItem(UUID userId, AddCartItemRequest request) {
		Cart cart = readOrCreate(userId);
		cart.add(request.productId(), request.quantity());
		return CartResponse.from(persist(userId, cart));
	}

	public CartResponse setQuantity(UUID userId, UUID productId, int quantity) {
		Cart cart = readOrCreate(userId);
		cart.setQuantity(productId, quantity);
		cart = persist(userId, cart);
		if (cart.isEmpty()) {
			cartRedisTemplate.delete(key(userId));
			return CartResponse.empty(userId);
		}
		return CartResponse.from(cart);
	}

	public CartResponse removeItem(UUID userId, UUID productId) {
		Cart cart = readOrCreate(userId);
		cart.remove(productId);
		cart = persist(userId, cart);
		if (cart.isEmpty()) {
			cartRedisTemplate.delete(key(userId));
			return CartResponse.empty(userId);
		}
		return CartResponse.from(cart);
	}

	public void clearCart(UUID userId) {
		cartRedisTemplate.delete(key(userId));
	}

	/**
	 * Trả về TTL hiện tại của key giỏ hàng người dùng, dùng cho kiểm thử TTL.
	 * Đơn vị giây; -2 nếu key không tồn tại, -1 nếu không có TTL.
	 */
	public Long remainingTtlSeconds(UUID userId) {
		return cartRedisTemplate.getExpire(key(userId));
	}

	private Cart readOrCreate(UUID userId) {
		Cart cart = cartRedisTemplate.opsForValue().get(key(userId));
		return cart == null ? new Cart(userId) : cart;
	}

	private Cart persist(UUID userId, Cart cart) {
		cart.touchUpdatedAt();
		cartRedisTemplate.opsForValue().set(key(userId), cart, ttl);
		return cart;
	}

	private String key(UUID userId) {
		return "cart:" + userId;
	}
}
