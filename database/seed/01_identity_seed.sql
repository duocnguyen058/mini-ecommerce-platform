-- =============================================================================
-- 01_identity_seed.sql
-- Seed default roles and initial users (Admin & Customer)
-- Password hash: $2a$10$fqlrezjx42J2oFRe/E8wI.YZuxeeGqqQihzcHfAvy9QDy0Htfbcrm (Passw0rd!)
-- =============================================================================

-- 1. Roles
INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'ADMIN',    'System administrator', now(), now()),
    ('a0000000-0000-0000-0000-000000000002', 'CUSTOMER', 'Regular customer',    now(), now())
ON CONFLICT (name) DO NOTHING;

-- 2. Users
INSERT INTO users (id, username, password, email, full_name, phone, enabled, email_verified, created_at, updated_at)
VALUES
    ('b0000000-0000-0000-0000-000000000001',
     'admin',
     '$2a$10$fqlrezjx42J2oFRe/E8wI.YZuxeeGqqQihzcHfAvy9QDy0Htfbcrm',
     'admin@local',
     'Admin User',
     '0900000001',
     true,
     true,
     now(),
     now()),
    ('b0000000-0000-0000-0000-000000000002',
     'customer',
     '$2a$10$fqlrezjx42J2oFRe/E8wI.YZuxeeGqqQihzcHfAvy9QDy0Htfbcrm',
     'customer@local',
     'Customer User',
     '0900000002',
     true,
     true,
     now(),
     now())
ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    enabled = EXCLUDED.enabled,
    email_verified = EXCLUDED.email_verified;

-- 3. User Roles Mapping
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
