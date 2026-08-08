
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);


INSERT INTO categories (id, name, slug, created_at, updated_at)
VALUES
    -- Điện tử / công nghệ
    ('11111111-1111-1111-1111-111111111111', 'Điện thoại',          'dien-thoai',          NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Máy tính xách tay',   'may-tinh-xach-tay',   NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Máy tính bảng',       'may-tinh-bang',       NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'Đồng hồ thông minh',  'dong-ho-thong-minh',  NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'Tai nghe',            'tai-nghe',            NOW(), NOW()),
    ('66666666-6666-6666-6666-666666666666', 'Phụ kiện công nghệ',  'phu-kien-cong-nghe',  NOW(), NOW()),
    ('77777777-7777-7777-7777-777777777777', 'Màn hình',            'man-hinh',            NOW(), NOW()),
    ('88888888-8888-8888-8888-888888888888', 'Loa',                 'loa',                 NOW(), NOW()),
    -- Gia dụng / nhà cửa
    ('99999999-9999-9999-9999-999999999999', 'Đồ gia dụng',         'do-gia-dung',         NOW(), NOW()),
    ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'Nội thất',            'noi-that',            NOW(), NOW()),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Đồ bếp',              'do-bep',              NOW(), NOW()),
    -- Thời trang
    ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Thời trang nam',      'thoi-trang-nam',      NOW(), NOW()),
    ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'Thời trang nữ',       'thoi-trang-nu',       NOW(), NOW()),
    ('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'Giày dép',            'giay-dep',            NOW(), NOW()),
    ('a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', 'Túi ví',              'tui-vi',              NOW(), NOW()),
    -- Làm đẹp / sức khỏe
    ('a6a6a6a6-a6a6-a6a6-a6a6-a6a6a6a6a6a6', 'Mỹ phẩm',             'my-pham',             NOW(), NOW()),
    ('a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', 'Chăm sóc sức khỏe',   'cham-soc-suc-khoe',   NOW(), NOW()),
    -- Mẹ & bé
    ('a8a8a8a8-a8a8-a8a8-a8a8-a8a8a8a8a8a8', 'Mẹ và bé',            'me-va-be',            NOW(), NOW()),
    -- Thể thao / ngoài trời
    ('a9a9a9a9-a9a9-a9a9-a9a9-a9a9a9a9a9a9', 'Thể thao',            'the-thao',            NOW(), NOW()),
    ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', 'Dã ngoại',            'da-ngoai',            NOW(), NOW()),
    -- Sách / văn phòng phẩm
    ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Sách',                'sach',                NOW(), NOW()),
    ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Văn phòng phẩm',      'van-phong-pham',      NOW(), NOW()),
    -- Thực phẩm
    ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'Thực phẩm khô',       'thuc-pham-kho',       NOW(), NOW()),
    ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'Đồ uống',             'do-uong',             NOW(), NOW()),
    -- Xe cộ
    ('b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 'Phụ kiện xe hơi',     'phu-kien-xe-hoi',     NOW(), NOW()),
    ('b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', 'Phụ kiện xe máy',     'phu-kien-xe-may',     NOW(), NOW()),
    -- Thú cưng
    ('b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7', 'Thú cưng',            'thu-cung',            NOW(), NOW()),
    -- Đồ chơi
    ('b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8', 'Đồ chơi',             'do-choi',             NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


WITH brand_data (category_id, prefix, brands) AS (
    VALUES
        -- Điện tử / công nghệ
        ('11111111-1111-1111-1111-111111111111'::uuid, 'PHONE', ARRAY['Samsung Galaxy','iPhone','Xiaomi Redmi','Oppo Reno','Vivo V']),
        ('22222222-2222-2222-2222-222222222222'::uuid, 'LAPTOP', ARRAY['Dell XPS','MacBook Pro','Asus Zenbook','Lenovo ThinkPad','HP Spectre']),
        ('33333333-3333-3333-3333-333333333333'::uuid, 'TABLET', ARRAY['iPad Air','Samsung Tab S','Xiaomi Pad','Lenovo Tab','Huawei MatePad']),
        ('44444444-4444-4444-4444-444444444444'::uuid, 'WATCH', ARRAY['Apple Watch','Galaxy Watch','Xiaomi Watch','Garmin Venu','Amazfit GTR']),
        ('55555555-5555-5555-5555-555555555555'::uuid, 'AUDIO', ARRAY['AirPods','Galaxy Buds','Sony WH','JBL Tune','Anker Soundcore']),
        ('66666666-6666-6666-6666-666666666666'::uuid, 'ACC', ARRAY['Sac Nhanh Anker','Op Lung Spigen','Cap USB-C Baseus','Pin Du Phong Xiaomi','Kinh Cuong Luc']),
        ('77777777-7777-7777-7777-777777777777'::uuid, 'MON', ARRAY['Dell UltraSharp','LG UltraGear','Samsung Odyssey','ViewSonic VX','AOC Gaming']),
        ('88888888-8888-8888-8888-888888888888'::uuid, 'SPK', ARRAY['JBL Flip','Sony SRS','Marshall Emberton','Bose SoundLink','Harman Kardon']),
        -- Gia dụng / nhà cửa
        ('99999999-9999-9999-9999-999999999999'::uuid, 'GD', ARRAY['May Loc Nuoc Karofi','Quat Dieu Hoa Sunhouse','May Hut Bui Xiaomi','Den Ngu LED','Robot Hut Bui Ecovacs']),
        ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0'::uuid, 'NT', ARRAY['Ban Lam Viec Erosstyle','Ghe Sofa Juno','Ke Sach Ikea Style','Giuong Ngu Go Cong Nghiep','Tu Quan Ao 4 Canh']),
        ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'::uuid, 'BEP', ARRAY['Noi Chien Khong Dau Philips','Bep Tu Sunhouse','Noi Com Dien Cuckoo','May Xay Sinh To Bluestone','Bo Noi Inox 5 Day']),
        -- Thời trang
        ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'::uuid, 'TTN', ARRAY['Ao Thun Nam Coolmate','Quan Jean Nam Levis','Ao So Mi Nam Owen','Quan Kaki Nam','Ao Khoac Nam The Bag'] ),
        ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3'::uuid, 'TTNU', ARRAY['Dam Nu Elise','Ao Kieu Nu Ivy Moda','Chan Vay Nu','Quan Jean Nu','Ao Khoac Nu Format']),
        ('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4'::uuid, 'GIAY', ARRAY['Giay The Thao Nike','Giay Sneaker Adidas','Giay Da Nam Vascara','Dep Quai Ngang Biti','Giay Boot Nu']),
        ('a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5'::uuid, 'TUI', ARRAY['Balo Laptop Simplecarry','Tui Xach Nu Juno','Vi Da Nam Vascara','Tui Deo Cheo Nu','Vali Keo Sakos']),
        -- Làm đẹp / sức khỏe
        ('a6a6a6a6-a6a6-a6a6-a6a6-a6a6a6a6a6a6'::uuid, 'MP', ARRAY['Kem Chong Nang Anessa','Serum Vitamin C Cocoon','Son Duong 3CE','Sua Rua Mat Cerave','Nuoc Hoa Hong Klairs']),
        ('a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7'::uuid, 'CSSK', ARRAY['May Do Huyet Ap Omron','Vien Uong Vitamin DHC','Khau Trang Y Te 4 Lop','May Xong Hoi Mui','Nhiet Ke Dien Tu']),
        -- Mẹ & bé
        ('a8a8a8a8-a8a8-a8a8-a8a8-a8a8a8a8a8a8'::uuid, 'MB', ARRAY['Bim Ta Em Be Bobby','Sua Bot Enfagrow','Xe Day Em Be Fuller','Binh Sua Comotomo','Do Choi Giao Duc Fisher Price']),
        -- Thể thao / ngoài trời
        ('a9a9a9a9-a9a9-a9a9-a9a9-a9a9a9a9a9a9'::uuid, 'TT', ARRAY['Xe Dap The Thao Giant','Tham Yoga Liforme','Gang Tay Tap Gym','Bong Da Grand Sport','Vot Cau Long Yonex']),
        ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0'::uuid, 'DN', ARRAY['Leu Cam Trai Naturehike','Balo Du Lich Quechua','Binh Giu Nhiet Lock Lock','Den Pin Sac Nang Luong','Ghe Xep Da Ngoai']),
        -- Sách / văn phòng phẩm
        ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1'::uuid, 'SACH', ARRAY['Sach Ky Nang Song','Sach Van Hoc Kinh Dien','Sach Kinh Te Tai Chinh','Truyen Tranh Thieu Nhi','Sach Ngoai Ngu']),
        ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'::uuid, 'VPP', ARRAY['But Bi Thien Long','So Tay Campus','May Tinh Casio','Bo But Long Mau Stabilo','Ke Sach Mini Ban']),
        -- Thực phẩm
        ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3'::uuid, 'TPK', ARRAY['Hat Dieu Rang Muoi','Mi Goi Han Quoc','Ngu Coc An Sang Nestle','Rong Bien Kho Tao Vi','Yen Mach Quaker']),
        ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4'::uuid, 'DU', ARRAY['Ca Phe Hoa Tan Trung Nguyen','Tra Sua Tran Chau','Nuoc Ep Trai Cay Nguyen Chat','Nuoc Suoi Lavie','Tra Xanh Khong Do Uong Lien']),
        -- Xe cộ
        ('b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5'::uuid, 'PKXH', ARRAY['Camera Hanh Trinh Xiaomi','Tham Lot San Oto','Gia Do Dien Thoai Oto','Nuoc Rua Kinh Oto','Sac Oto Nhanh Anker']),
        ('b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6'::uuid, 'PKXM', ARRAY['Mu Bao Hiem Andes','Bao Tay Xe May','Guong Chieu Hau','Bao Yen Xe May','Den Led Xe May']),
        -- Thú cưng
        ('b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7'::uuid, 'PET', ARRAY['Thuc An Cho Meo Whiskas','Thuc An Cho Cho Pedigree','Cat Ve Sinh Cho Meo','Chuong Nuoi Thu Cung','Do Choi Cho Cho']),
        -- Đồ chơi
        ('b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8'::uuid, 'TOY', ARRAY['Xep Hinh Lego','Robot Dieu Khien Tu Xa','Do Choi Xep Hinh Go','Bup Be Barbie','Xe Do Choi Mo Hinh'])
),
series AS (
    SELECT
        bd.category_id,
        bd.prefix,
        brand,
        v AS version_no,
        row_number() OVER (ORDER BY bd.prefix, brand, v) AS rn
    FROM brand_data bd
    CROSS JOIN LATERAL unnest(bd.brands) AS brand
    CROSS JOIN LATERAL generate_series(1, 8) AS v   -- <-- đổi số 8 để tăng/giảm số version mỗi brand
)
INSERT INTO products (
    id, category_id, sku, name, slug, description, price, status, version, image_url, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    category_id,
    prefix || '-' || upper(regexp_replace(brand, '[^a-zA-Z0-9]+', '', 'g')) || '-' || lpad(version_no::text, 3, '0'),
    brand || ' ' || version_no,
    lower(prefix) || '-' || lower(regexp_replace(brand, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || version_no,
    'Sản phẩm ' || brand || ' phiên bản ' || version_no || ', hàng demo phục vụ kiểm thử Catalog Service.',
    -- giá ngẫu nhiên 2.000.000 - 40.000.000, làm tròn nghìn
    (round((2000000 + random() * 38000000)::numeric, -3))::numeric(12,2),
    CASE WHEN random() < 0.9 THEN 'ACTIVE' ELSE 'INACTIVE' END,
    0,
    -- ảnh demo Lorem Picsum, seed = sku để mỗi sản phẩm có ảnh cố định riêng
    'https://picsum.photos/seed/' || prefix || upper(regexp_replace(brand, '[^a-zA-Z0-9]+', '', 'g')) || version_no || '/600/600',
    NOW(),
    NOW()
FROM series
ON CONFLICT DO NOTHING;

