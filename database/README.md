# Mini E-Commerce Platform — Database Architecture & Operations

Thư mục `database/` quản lý toàn bộ cơ sở dữ liệu tập trung (`ecommerce_db`) cho toàn bộ hệ thống Mini E-Commerce Platform.

---

## 1. Cấu trúc thư mục

```text
database/
├── README.md                 # Tài liệu hướng dẫn sử dụng & vận hành DB
├── migrations/               # Versioned SQL Migrations (Flyway style)
│   ├── V1__init_schema.sql   # DDL khởi tạo toàn bộ 25 bảng, indexes, foreign keys
│   └── V2__seed_data.sql     # DML nạp dữ liệu ban đầu (Users, Catalog, Inventory, Coupons)
├── schema/                   # Schema phân module rõ ràng để tra cứu/phát triển
│   ├── 01_identity.sql       # roles, users, user_roles, verification_tokens
│   ├── 02_catalog.sql        # brands, categories, products, variants, specs, reviews, media...
│   ├── 03_inventory.sql      # inventory_items, inventory_reservations, inventory_transactions
│   ├── 04_order.sql          # orders, order_items, order_reservations, coupons, idempotency, outbox
│   ├── 05_payment.sql        # payments, payment_transactions
│   └── 06_notification.sql   # notifications
├── seed/                     # Dữ liệu khởi tạo phân theo module
│   ├── 01_identity_seed.sql  # Users (admin, customer) & Roles
│   ├── 02_catalog_inventory_seed.sql # Brands, Categories, Products & Stock
│   └── 03_order_coupons_seed.sql     # Coupons (WELCOME10, FREESHIP, SALE50K)
├── scripts/                  # Bộ công cụ quản trị Database
│   ├── init_db.sh            # Khởi tạo DB, tạo schema và nạp seed
│   ├── reset_db.sh           # Reset sạch DB và khởi tạo lại từ đầu
│   ├── backup_db.sh          # Sao lưu toàn bộ DB ra file .sql.gz
│   └── restore_db.sh         # Phục hồi DB từ file backup
├── backup/                   # Thư mục lưu trữ các bản backup
└── init/                     # Entrypoint tự động cho PostgreSQL Docker Container
    └── 01-init-database.sh   # Tự động thực thi khi container Postgres tạo mới
```

---

## 2. Danh sách bảng & Thiết kế Quan hệ (Schema Overview)

Tất cả 25 bảng được quản trị thống nhất trong `ecommerce_db`:

1. **Identity**: `roles`, `users`, `user_roles`, `verification_tokens`
2. **Catalog**: `brands`, `categories`, `products`, `product_media`, `product_variants`, `product_units`, `product_specifications`, `product_reviews`, `review_images`, `comments`, `comment_replies`, `wishlists`, `recently_viewed`, `audit_logs`
3. **Inventory**: `inventory_items`, `inventory_reservations`, `inventory_transactions`
4. **Order**: `orders`, `order_items`, `order_reservations`, `coupons`, `idempotency_records`, `outbox_events`
5. **Payment**: `payments`, `payment_transactions`
6. **Notification**: `notifications`

Tất cả các mối quan hệ khoá ngoại (Foreign Key Constraints) đã được chuẩn hóa liên kết trực tiếp (VD: `products` -> `categories` & `brands`, `inventory_items` -> `products`, `orders` -> `users`, `order_items` -> `orders` & `products`, `payments` -> `orders`, `notifications` -> `users`).

---

## 3. Hướng dẫn Quản trị & Vận hành (CLI Scripts)

Cấp quyền thực thi cho các script:
```bash
chmod +x database/scripts/*.sh
```

### Khởi tạo Database lần đầu
```bash
./database/scripts/init_db.sh
```

### Reset toàn bộ Database (Clean & Re-seed)
```bash
./database/scripts/reset_db.sh
```

### Sao lưu Database (Backup)
```bash
./database/scripts/backup_db.sh
# File backup sẽ được tạo trong database/backup/backup_ecommerce_db_YYYYMMDD_HHMMSS.sql.gz
```

### Phục hồi Database (Restore)
```bash
./database/scripts/restore_db.sh database/backup/backup_ecommerce_db_YYYYMMDD_HHMMSS.sql.gz
```

---

## 4. Cấu hình Kết nối từ Microservices

Tất cả các microservice kết nối chung đến `ecommerce_db`:

| Tham số | Chạy Local (Dev) | Chạy qua Docker Compose |
|---|---|---|
| **Host** | `localhost` | `postgres` |
| **Port** | `5433` | `5432` |
| **Database Name** | `ecommerce_db` | `ecommerce_db` |
| **Username** | `ecommerce` | `ecommerce` |
| **Password** | `ecommerce_local` | `ecommerce_local` |
| **JDBC URL** | `jdbc:postgresql://localhost:5433/ecommerce_db` | `jdbc:postgresql://postgres:5432/ecommerce_db` |

---

## 5. Tài khoản & Dữ liệu Seed Mặc định

- **Admin Account**: `admin` / `Passw0rd!` (`admin@local`) — Quyền: `ADMIN`, `CUSTOMER`
- **Customer Account**: `customer` / `Passw0rd!` (`customer@local`) — Quyền: `CUSTOMER`
- **Coupons**: `WELCOME10` (Giảm 10%), `FREESHIP` (Giảm 30.000đ cho đơn từ 200.000đ), `SALE50K` (Giảm 50.000đ cho đơn từ 500.000đ)
- **Catalog & Inventory**: Đầy đủ 20+ danh mục đa cấp, thương hiệu hàng đầu thế giới và Việt Nam (Apple, Samsung, Xiaomi, Panasonic, Coolmate, Routine...), hàng trăm SKU và tồn kho sẵn sàng checkout.
