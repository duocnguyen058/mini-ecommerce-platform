-- =============================================================================
-- 03_order_coupons_seed.sql
-- Seed sample discount coupons
-- =============================================================================

INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_usage, used_count, expires_at, is_active, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'WELCOME10', 'PERCENT', 10, 0, 1000, 0, now() + interval '365 days', true, now(), now()),
  ('c0000000-0000-0000-0000-000000000002', 'FREESHIP', 'FIXED', 30000, 200000, 500, 0, now() + interval '30 days', true, now(), now()),
  ('c0000000-0000-0000-0000-000000000003', 'SALE50K', 'FIXED', 50000, 500000, 200, 0, now() + interval '7 days', true, now(), now())
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  max_usage = EXCLUDED.max_usage,
  expires_at = EXCLUDED.expires_at,
  is_active = EXCLUDED.is_active;
