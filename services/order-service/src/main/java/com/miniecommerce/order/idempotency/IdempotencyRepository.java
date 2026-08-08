package com.miniecommerce.order.idempotency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface IdempotencyRepository extends JpaRepository<IdempotencyRecord, String> {

	/** Tìm các record cũ hơn {@code before} — dùng dọn dẹp định kỳ. */
	@Query("select r from IdempotencyRecord r where r.createdAt < :before")
	List<IdempotencyRecord> findOlderThan(@Param("before") Instant before);
}
