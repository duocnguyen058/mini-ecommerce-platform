package com.miniecommerce.order.order;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, UUID> {

	/**
	 * Lấy tất cả đơn của user, sắp xếp theo page — dùng cho customer.
	 * <p>
	 * KHÔNG dùng {@code @EntityGraph(attributePaths={"items","statusHistory"})}
	 * vì Hibernate không cho phép fetch multiple bags (List) cùng lúc —
	 * ném {@code MultipleBagFetchException}. Thay vào đó các collection
	 * được lazy-load trong transaction {@code readOnly} của {@code OrderService}
	 * và tránh N+1 nhờ {@code @BatchSize} trên entity {@link Order}.
	 */
	Page<Order> findByUserId(UUID userId, Pageable pageable);

	/** Lấy đơn của user lọc theo status. */
	Page<Order> findByUserIdAndStatus(UUID userId, OrderStatus status, Pageable pageable);

	/** Lọc tất cả đơn theo status — dùng cho admin. */
	Page<Order> findByStatus(OrderStatus status, Pageable pageable);

	long countByStatus(OrderStatus status);

	@org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'DELIVERED'")
	java.math.BigDecimal calculateDeliveredRevenue();

	@org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status NOT IN ('CANCELLED', 'RETURNED')")
	java.math.BigDecimal calculateTotalActiveRevenue();
}

