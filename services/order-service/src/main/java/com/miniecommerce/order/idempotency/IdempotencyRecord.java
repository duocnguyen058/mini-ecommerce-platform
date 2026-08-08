package com.miniecommerce.order.idempotency;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entity bản ghi idempotency — bảng {@code idempotency_records}.
 * <p>
 * Mỗi checkout có {@code Idempotency-Key} (header). Khi một key đã được dùng,
 * request sau cùng gọi lại với cùng key phải trả về response cũ (cùng order id).
 * <p>
 * Bản ghi được lưu cùng transaction với {@link com.miniecommerce.order.order.Order}
 * để đảm bảo: nếu order tạo xong nhưng client mạng lag → client retry → key thấy
 * record → trả order id cũ, không tạo đơn mới.
 */
@Entity
@Table(name = "idempotency_records")
public class IdempotencyRecord {

	@Id
	@Column(name = "idempotency_key", nullable = false, length = 100)
	private String idempotencyKey;

	@Column(name = "request_hash", nullable = false, length = 64)
	private String requestHash;

	@Column(name = "response_id")
	private UUID responseId;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected IdempotencyRecord() {
	}

	public IdempotencyRecord(String idempotencyKey, String requestHash, UUID responseId) {
		this.idempotencyKey = idempotencyKey;
		this.requestHash = requestHash;
		this.responseId = responseId;
		this.createdAt = Instant.now();
	}

	public String getIdempotencyKey() {
		return idempotencyKey;
	}

	public String getRequestHash() {
		return requestHash;
	}

	public UUID getResponseId() {
		return responseId;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setResponseId(UUID responseId) {
		this.responseId = responseId;
	}
}
