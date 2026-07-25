INSERT INTO categories (id, name, slug, created_at, updated_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Điện thoại', 'dien-thoai', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Máy tính xách tay', 'may-tinh-xach-tay', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO products (
    id,
    category_id,
    sku,
    name,
    slug,
    description,
    price,
    status,
    version,
    created_at,
    updated_at
)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'PHONE-DEMO-001',
        'Điện thoại Demo',
        'dien-thoai-demo',
        'Sản phẩm mẫu phục vụ kiểm thử Catalog Service.',
        9990000.00,
        'ACTIVE',
        0,
        NOW(),
        NOW()
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '22222222-2222-2222-2222-222222222222',
        'LAPTOP-DEMO-001',
        'Laptop Demo',
        'laptop-demo',
        'Sản phẩm mẫu phục vụ kiểm thử Catalog Service.',
        19990000.00,
        'ACTIVE',
        0,
        NOW(),
        NOW()
    )
ON CONFLICT DO NOTHING;

