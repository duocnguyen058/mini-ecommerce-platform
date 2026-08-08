package com.miniecommerce.cart.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.miniecommerce.cart.cart.Cart;

/**
 * Cấu hình RedisTemplate cho giỏ hàng, serialize bằng JSON (Jackson 3, được Spring
 * Boot 4 dùng mặc định) để debug Redis dễ đọc và tránh phụ thuộc kiểu tuần tự mặc
 * định của JDK.
 */
@Configuration
public class RedisConfig {

	@Bean
	RedisTemplate<String, Cart> cartRedisTemplate(RedisConnectionFactory connectionFactory) {
		JacksonJsonRedisSerializer<Cart> serializer = new JacksonJsonRedisSerializer<>(Cart.class);
		RedisTemplate<String, Cart> template = new RedisTemplate<>();
		template.setConnectionFactory(connectionFactory);
		template.setKeySerializer(new StringRedisSerializer());
		template.setValueSerializer(serializer);
		template.setHashKeySerializer(new StringRedisSerializer());
		template.setHashValueSerializer(serializer);
		template.afterPropertiesSet();
		return template;
	}
}
