-- V2: Seed default users + roles cho hệ thống.
--
-- 2 tài khoản demo:
--   - admin    / Passw0rd!  — role ADMIN + CUSTOMER
--   - customer / Passw0rd!  — role CUSTOMER
--
-- Password hash dùng BCryptPasswordEncoder (Spring Security) với strength=10.
-- Hash: $2a$10$fqlrezjx42J2oFRe/E8wI.YZuxeeGqqQihzcHfAvy9QDy0Htfbcrm
-- Verify bằng BCryptPasswordEncoder.matches("Passw0rd!", hash) → true.
--
-- Idempotent: xoá user cũ (nếu có) trước khi insert mới — tránh conflict email/username unique.
-- CASCADE trên user_roles xoá luôn role mapping cũ.

-- 1) Roles
INSERT INTO roles (id, name, description)
VALUES
    (gen_random_uuid(), 'ADMIN',    'System administrator'),
    (gen_random_uuid(), 'CUSTOMER', 'Regular customer')
ON CONFLICT (name) DO NOTHING;

-- 2) Xoá user cũ nếu tồn tại (CASCADE xoá user_roles liên quan).
DELETE FROM users WHERE username IN ('admin', 'customer');

-- 3) Insert user mới với password + email chuẩn.
INSERT INTO users (id, username, password, email, full_name, phone, enabled)
VALUES
    (gen_random_uuid(),
     'admin',
     '$2a$10$fqlrezjx42J2oFRe/E8wI.YZuxeeGqqQihzcHfAvy9QDy0Htfbcrm',
     'admin@local',
     'Admin User',
     '0900000001',
     true),
    (gen_random_uuid(),
     'customer',
     '$2a$10$fqlrezjx42J2oFRe/E8wI.YZuxeeGqqQihzcHfAvy9QDy0Htfbcrm',
     'customer@local',
     'Customer User',
     '0900000002',
     true);

-- 4) Gán roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name IN ('ADMIN', 'CUSTOMER')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'customer' AND r.name = 'CUSTOMER'
ON CONFLICT DO NOTHING;
