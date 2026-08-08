package com.miniecommerce.order.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * Publish {@link OutboxEvent} tới RabbitMQ exchange {@code order.events}
 * với routing-key = {@code OutboxEvent.eventType}.
 * <p>
 * Lệnh này chỉ publish — không commit DB. {@link OutboxPoller} đảm nhiệm việc
 * đọc PENDING + gọi publisher + mark SENT trong transaction riêng để không
 * nhận hai lần (idempotency cho consumer nằm ở payload {@code eventId}).
 */
@Component
public class OrderEventPublisher {

	private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

	private final RabbitTemplate rabbitTemplate;

	public OrderEventPublisher(RabbitTemplate rabbitTemplate) {
		this.rabbitTemplate = rabbitTemplate;
	}

	/**
	 * Publish event. Trả về true nếu gửi thành công; false nếu lỗi (poller giữ PENDING).
	 */
	public boolean publish(OutboxEvent event) {
		try {
			rabbitTemplate.convertAndSend(
				OrderMessagingConfig.ORDER_EXCHANGE,
				event.getEventType(),
				event.getPayload());
			return true;
		}
		catch (Exception ex) {
			log.warn("publish event {} thất bại: {}", event.getId(), ex.getMessage());
			return false;
		}
	}
}
