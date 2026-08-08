package com.miniecommerce.order.messaging;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

	/** Lấy các event PENDING theo thứ tự id tăng dần, page tối đa {@code batchSize}. */
	List<OutboxEvent> findByStatusOrderByIdAsc(OutboxEvent.OutboxStatus status, Pageable pageable);
}
