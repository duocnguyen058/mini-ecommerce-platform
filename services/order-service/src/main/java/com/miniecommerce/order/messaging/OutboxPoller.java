package com.miniecommerce.order.messaging;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import com.miniecommerce.order.shared.config.OrderProperties;
import com.miniecommerce.order.shared.config.OrderProperties.OutboxConfig;

/**
 * Poller Outbox — quét các {@link OutboxEvent} trạng thái PENDING, publish tới RabbitMQ,
 * mark SENT. Bọc trong transaction mới (REQUIRES_NEW) cho từng event để commit độc lập
 * và không khoá transaction checkout.
 * <p>
 * Cứ {@code outbox.poll-interval-ms} (mặc định 1000ms) chạy một lần; mỗi lần lấy tối đa
 * {@code outbox.batch-size} (mặc định 50) event theo thứ tự id tăng dần (FIFO).
 * <p>
 * Xử lý lỗi: nếu publish fail, event giữ PENDING → retry lần sau. Không ném exception
 * ra ngoài scheduler để Spring scheduler không ngừng (mình chỉ log).
 */
@Component
public class OutboxPoller {

	private static final Logger log = LoggerFactory.getLogger(OutboxPoller.class);

	private final OutboxEventRepository outboxRepository;
	private final OrderEventPublisher publisher;
	private final TransactionTemplate tx;
	private final int batchSize;

	public OutboxPoller(OutboxEventRepository outboxRepository,
			OrderEventPublisher publisher,
			TransactionTemplate tx,
			OrderProperties properties) {
		this.outboxRepository = outboxRepository;
		this.publisher = publisher;
		this.tx = tx;
		tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
		OutboxConfig cfg = properties.outbox();
		this.batchSize = cfg == null || cfg.batchSize() <= 0 ? 50 : cfg.batchSize();
	}

	@Scheduled(fixedDelayString = "${outbox.poll-interval-ms:1000}")
	public void poll() {
		List<OutboxEvent> pending = outboxRepository.findByStatusOrderByIdAsc(
			OutboxEvent.OutboxStatus.PENDING, PageRequest.of(0, batchSize));
		if (pending.isEmpty()) {
			return;
		}
		for (OutboxEvent event : pending) {
			processOne(event);
		}
	}

	private void processOne(OutboxEvent event) {
		try {
			Boolean ok = tx.execute(status -> {
				OutboxEvent fresh = outboxRepository.findById(event.getId()).orElse(null);
				if (fresh == null || fresh.getStatus() == OutboxEvent.OutboxStatus.SENT) {
					// đã gửi trong lần poll trước — bỏ qua
					return true;
				}
				if (publisher.publish(fresh)) {
					fresh.markSent();
					outboxRepository.save(fresh);
					return true;
				}
				return false;
			});
			if (Boolean.FALSE.equals(ok)) {
				log.debug("outbox event {} chưa gửi được, sẽ retry lần sau", event.getId());
			}
		}
		catch (Exception ex) {
			// transaction rollback → status vẫn PENDING → retry lần sau.
			// Không throw để scheduler tiếp tục chạy.
			log.warn("xử lý outbox event {} lỗi: {}", event.getId(), ex.getMessage());
		}
	}
}
