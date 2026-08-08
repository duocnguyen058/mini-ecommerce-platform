package com.miniecommerce.order.messaging;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.ColumnTransformer;

/**
 * Entity sự kiện outbox — bảng {@code outbox_events}.
 * <p>
 * Pattern Transactional Outbox: event được ghi cùng transaction với {@link com.miniecommerce.order.order.Order}
 * → đảm bảo tất-or-nothing (không mất event khi crash giữa commit DB và publish AMQP).
 * <p>
 * {@link OutboxPoller} quét các event {@link OutboxStatus#PENDING}, gửi tới RabbitMQ,
 * đánh dấu {@link OutboxStatus#SENT} + {@code sentAt}.
 */
@Entity
@Table(name = "outbox_events")
public class OutboxEvent {

	@Id
	private UUID id;

	@Column(name = "aggregate_type", nullable = false, length = 50)
	private String aggregateType;

	@Column(name = "aggregate_id", nullable = false)
	private UUID aggregateId;

	@Column(name = "event_type", nullable = false, length = 50)
	private String eventType;

	/** Payload sẵn sàng publish — JSON string. Lưu vào JSONB qua cast "::jsonb". */
	@Column(nullable = false, columnDefinition = "jsonb")
	@ColumnTransformer(write = "?::jsonb")
	private String payload;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private OutboxStatus status;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "sent_at")
	private Instant sentAt;

	protected OutboxEvent() {
	}

	public OutboxEvent(String aggregateType, UUID aggregateId, String eventType, String payload) {
		this.id = UUID.randomUUID();
		this.aggregateType = aggregateType;
		this.aggregateId = aggregateId;
		this.eventType = eventType;
		this.payload = payload;
		this.status = OutboxStatus.PENDING;
		this.createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public String getAggregateType() {
		return aggregateType;
	}

	public UUID getAggregateId() {
		return aggregateId;
	}

	public String getEventType() {
		return eventType;
	}

	public String getPayload() {
		return payload;
	}

	public OutboxStatus getStatus() {
		return status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getSentAt() {
		return sentAt;
	}

	/** Đánh dấu đã gửi — gọi sau khi publish AMQP thành công. */
	public void markSent() {
		this.status = OutboxStatus.SENT;
		this.sentAt = Instant.now();
	}

	/** Trạng thái outbox: PENDING (chưa gửi) → SENT (đã publish AMQP). */
	public enum OutboxStatus {
		PENDING,
		SENT
	}
}
