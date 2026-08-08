package com.miniecommerce.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.miniecommerce.order.messaging.OrderMessagingConfig;
import com.miniecommerce.order.messaging.OutboxEvent;
import com.miniecommerce.order.messaging.OutboxEventRepository;

/**
 * Test OutboxPoller: tạo event PENDING → đợi poller chạy (default 1000ms, override 200ms
 * trong application-test.yml) → verify event gửi tới queue {@code order.confirmed} +
 * status chuyển SENT.
 * <p>
 * Dùng Testcontainers RabbitMQ — queue do {@link OrderMessagingConfig} khai báo sẽ tự
 * tạo khi Spring	context load. RabbitTemplate receive chờ message từ queue.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class OutboxPollerTests {

	@Autowired
	private OutboxEventRepository outboxRepository;

	@Autowired
	private RabbitTemplate rabbitTemplate;

	@Test
	void pendingEventIsPublishedAndMarkedSent() {
		// Given — tạo 1 event PENDING order.confirmed
		String payload = """
			{
			  "eventId": "%s",
			  "eventType": "order.confirmed",
			  "orderId": "%s",
			  "status": "CONFIRMED"
			}
			""".formatted(UUID.randomUUID(), UUID.randomUUID());
		OutboxEvent event = new OutboxEvent(
			"Order", UUID.randomUUID(), "order.confirmed", payload);
		outboxRepository.save(event);

		// When — OutboxPoller @Scheduled chạy nền (pollIntervalMs=200), publish event

		// Then — event PENDING → SENT, và queue nhận được message
		await().atMost(java.time.Duration.ofSeconds(15))
			.pollInterval(java.time.Duration.ofMillis(300))
			.untilAsserted(() -> {
				OutboxEvent fresh = outboxRepository.findById(event.getId()).orElseThrow();
				assertThat(fresh.getStatus()).isEqualTo(OutboxEvent.OutboxStatus.SENT);
				assertThat(fresh.getSentAt()).isNotNull();
				// Nhận message từ queue — rabbitTemplate.receive chờ ~ 2s
				org.springframework.amqp.core.Message msg = rabbitTemplate.receive(
					OrderMessagingConfig.QUEUE_ORDER_CONFIRMED, 2000);
				assertThat(msg).isNotNull();
				assertThat(new String(msg.getBody())).contains("order.confirmed");
			});
		// cleanup
		outboxRepository.delete(event);
	}
}
