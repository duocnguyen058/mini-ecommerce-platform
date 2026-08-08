package com.miniecommerce.order.messaging;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình AMQP cho order-service:
 * <ul>
 *   <li>Topic exchange {@code order.events} chia sẻ với các service khác.</li>
 *   <li>3 queues {@code order.created}/{@code order.confirmed}/{@code order.cancelled}
 *       binding routing-key tương ứng — durable (chờ consumer ở GĐ6).</li>
 *   <li>{@link JacksonJsonMessageConverter} Jackson 3 (Spring AMQP mới) — đúng convention cart.</li>
 * </ul>
 * Inventory-service chưa có consumer (defer AMQP ở GĐ4) → queues chờ GĐ6 wire. Queue durable
 * thông thường (auto-decompile=false) — không TTL để tránh mất event khi GĐ6 deploy chậm.
 */
@Configuration
public class OrderMessagingConfig {

	/** Tên exchange chia sẻ. */
	public static final String ORDER_EXCHANGE = "order.events";
	public static final String QUEUE_ORDER_CREATED = "order.created";
	public static final String QUEUE_ORDER_CONFIRMED = "order.confirmed";
	public static final String QUEUE_ORDER_CANCELLED = "order.cancelled";

	@Bean
	MessageConverter jacksonMessageConverter() {
		return new JacksonJsonMessageConverter();
	}

	@Bean
	TopicExchange orderExchange() {
		return new TopicExchange(ORDER_EXCHANGE, true, false);
	}

	@Bean
	Queue orderCreatedQueue() {
		return new Queue(QUEUE_ORDER_CREATED, true);
	}

	@Bean
	Queue orderConfirmedQueue() {
		return new Queue(QUEUE_ORDER_CONFIRMED, true);
	}

	@Bean
	Queue orderCancelledQueue() {
		return new Queue(QUEUE_ORDER_CANCELLED, true);
	}

	@Bean
	Declarables orderBindings(
		TopicExchange orderExchange,
		Queue orderCreatedQueue,
		Queue orderConfirmedQueue,
		Queue orderCancelledQueue
	) {
		Binding created = BindingBuilder.bind(orderCreatedQueue).to(orderExchange).with("order.created");
		Binding confirmed = BindingBuilder.bind(orderConfirmedQueue).to(orderExchange).with("order.confirmed");
		Binding cancelled = BindingBuilder.bind(orderCancelledQueue).to(orderExchange).with("order.cancelled");
		return new Declarables(orderExchange, orderCreatedQueue, orderConfirmedQueue, orderCancelledQueue,
			created, confirmed, cancelled);
	}
}
