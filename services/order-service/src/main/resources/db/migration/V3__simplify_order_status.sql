-- V3: Đơn giản hoá state machine xuống 6 trạng thái.
--
--   CŨ (9): PENDING, CONFIRMED, PROCESSING, SHIPPING, DELIVERED,
--          COMPLETED, CANCELLED, RETURN_REQUESTED, RETURNED
--   MỚI (6): PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED, RETURNED
--
-- 1) Map các status đã xoá về status tương đương còn dùng (không mất dữ liệu).
-- 2) Xoá bảng order_status_history + indexes liên quan (không còn track history).
-- 3) Idempotent: dùng IF EXISTS / WHERE để chạy lại không lỗi.

-- 1) Map status cũ sang status mới
UPDATE orders SET status = 'DELIVERED' WHERE status = 'COMPLETED';
UPDATE orders SET status = 'RETURNED' WHERE status = 'RETURN_REQUESTED';
UPDATE orders SET status = 'SHIPPING'  WHERE status = 'PROCESSING';

-- 2) Drop history table + indexes
DROP INDEX IF EXISTS idx_order_status_history_order_id;
DROP TABLE IF EXISTS order_status_history CASCADE;
