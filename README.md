# Mini E-Commerce Platform

Nền tảng thương mại điện tử (**Mini E-Commerce Platform**) được thiết kế và xây dựng theo chuẩn kiến trúc **Microservices** hiện đại, sẵn sàng triển khai trên môi trường đám mây và container hóa. Hệ thống bao gồm **8 backend microservices** (Java 25 / Spring Boot 4) được điều phối qua **API Gateway**, một **Frontend** hiện đại (Next.js 16 / React 19 / Tailwind CSS), cùng hạ tầng lưu trữ phân tán PostgreSQL 16, Redis 7.4 và RabbitMQ 4.3.

---

## 🧱 Tổng quan kiến trúc hệ thống

```
                        ┌─────────────────────────────┐
                        │    Frontend (Next.js 16)    │
                        │    http://localhost:3000    │
                        └──────────────┬──────────────┘
                                       │  HTTP / REST (JWT Bearer + Idempotency-Key)
                        ┌──────────────▼──────────────┐
                        │     Spring Cloud Gateway    │
                        │    http://localhost:8080    │
                        └──────┬──────┬──────┬─────┬──┴──────┬──────┬──────┬──────┐
                               │      │      │     │         │      │      │      │
            ┌──────────────────┼──────┼──────┼─────┼─────────┼──────┼──────┼──────┤
            │                  │      │      │     │         │      │      │      │
     ┌──────▼──────┐    ┌──────▼──────▼┐ ┌──▼──────▼─┐ ┌─────▼──────▼┐ ┌────▼──────▼┐ ┌─────▼──────┐
     │  Identity   │    │   Catalog    │ │   Cart    │ │    Order    │ │  Payment   │ │Notification│
     │   Service   │    │   Service    │ │  Service  │ │   Service   │ │  Service   │ │  Service   │
     │    :8081    │    │    :8082     │ │   :8084   │ │    :8085    │ │   :8086    │ │   :8087    │
     └──────┬──────┘    └──────┬───────┘ └─────┬─────┘ └──────┬──────┘ └─────┬──────┘ └─────┬──────┘
             │                  │               │              │              │              │
             └──────────────────┼───────────────┼──────────────┼──────────────┼──────────────┘
                                │               │              │              │
                         ┌──────▼────────┐┌─────▼─────┐ ┌──────▼──────┐ ┌─────▼──────┐
                         │ PostgreSQL    ││Redis :6379│ │       RabbitMQ :5672       │
                         │(ecommerce_db) │└───────────┘ │  (Exchange: order.events)  │
                         │ :5433 / :5432 │              └────────────────────────────┘
                         └───────────────┘
```

### Các microservices chính:
1. **API Gateway (:8080)** — Điểm vào duy nhất của hệ thống, gán `X-Correlation-Id`, xử lý CORS, phân phối route tới các microservices.
2. **Identity Service (:8081)** — Đăng ký, đăng nhập, phát hành JWT RS256 (bất đối xứng), xác thực email qua SMTP. Validate bắt buộc đầy đủ Họ và Tên.
3. **Catalog Service (:8082)** — Quản lý 28 thương hiệu, 45 danh mục đa cấp, hơn 100 sản phẩm, phiên bản (variants), đánh giá (reviews), bình luận (comments).
4. **Inventory Service (:8083)** — Quản lý tồn kho thực tế, khóa lạc quan (`@Version`), hỗ trợ tăng/giảm tồn kho chính xác theo từng sự kiện đơn hàng.
5. **Cart Service (:8084)** — Giỏ hàng lưu trữ trên Redis với thời hạn TTL 7 ngày, hiệu năng cao.
6. **Order Service (:8085)** — Checkout đơn hàng, quản lý đơn hàng theo State Machine, Idempotency, mã giảm giá Coupon, Transactional Outbox Pattern qua RabbitMQ. Phân định rõ ràng đơn hàng của người dùng cá nhân (`GET /api/orders`) và đơn quản trị (`GET /api/admin/orders`).
7. **Payment Service (:8086)** — Tích hợp Cổng thanh toán ZaloPay Sandbox (chữ ký số HMAC-SHA256, Webhook callback, đối soát giao dịch).
8. **Notification Service (:8087)** — Tiêu thụ sự kiện đơn hàng từ RabbitMQ (`order.events`), phân phát thông báo chi tiết cho Admin và thông báo trạng thái riêng tư cho khách hàng.

---

## ⚙️ Logic Nghiệp vụ Cốt Lõi (Core Business Logic)

### 1. Quản lý Địa chỉ & Họ tên
* **Địa chỉ tự do**: Người dùng tự nhập địa chỉ giao hàng đầy đủ (hỗ trợ địa chỉ dài, nhiều dòng). Không bắt buộc chọn từ danh mục có sẵn và không sử dụng dữ liệu mẫu cứng.
* **Họ và tên**: Bắt buộc nhập đầy đủ cả Họ và Tên (tối thiểu 2 từ, không chỉ nhập 1 ký tự hay khoảng trắng). Hiển thị đồng nhất trên toàn hệ thống.

### 2. State Machine Đơn hàng & Tồn kho thực tế
* **Khi khách đặt hàng (`POST /api/checkout`)**: Tạo đơn ở trạng thái `PENDING`. **Không trừ tồn kho thực tế**.
* **Khi Admin xác nhận đơn (`PENDING -> CONFIRMED`)**: Trừ đúng số lượng tồn kho thực tế (`quantity_on_hand -= quantity`). Không trừ lặp lại khi đơn chuyển tiếp sang `SHIPPING` hay `DELIVERED`.
* **Khi Admin/Khách hủy đơn chưa xác nhận (`PENDING -> CANCELLED`)**: Không thay đổi tồn kho.
* **Khi hủy đơn đã xác nhận (`CONFIRMED / SHIPPING / DELIVERED -> CANCELLED`)**: Hoàn trả lại đúng số lượng vào tồn kho thực tế (`quantity_on_hand += quantity`).
* **Khi khách hoàn trả hàng (`RETURNED`)**: Tăng hoàn trả đúng số lượng sản phẩm vào tồn kho thực tế.

### 3. Hệ thống Thông báo Phân quyền
* **Thông báo Admin**: Nhận thông báo khi có đơn mới với đầy đủ thông tin: Họ tên người đặt, Mã đơn, Tổng số lượng món, Tổng tiền và Thời gian đặt.
* **Thông báo Khách hàng**: Chỉ nhận thông báo liên quan trực tiếp đến đơn hàng của chính tài khoản (`order.created`, `order.confirmed`, `order.shipping`, `order.delivered`, `order.cancelled`, `order.returned`).

### 4. Đơn hàng của tôi ("My Orders")
* Trang "Đơn hàng của tôi" (`GET /api/orders`) luôn lọc đơn theo `userId` trích xuất từ JWT của tài khoản đăng nhập.
* Trang "Quản lý đơn hàng" của Admin (`GET /api/admin/orders`) chỉ dành riêng cho quyền quản trị viên (`ROLE_ADMIN`).

---

## 🛠 Ngôn ngữ & Công nghệ

### Backend (Spring Boot & Java 25)
| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **Java** | 25 (Temurin) | Ngôn ngữ backend chính |
| **Spring Boot** | 4.1.0 / 3.4.3 | Framework phát triển Microservices |
| **Spring Cloud Gateway** | 2024.0.0 (WebFlux) | API Gateway định tuyến phân tán |
| **Spring Security + OAuth2** | Resource Server | Bảo mật JWT RS256 xác thực qua `public.pem` |
| **Spring Data JPA** | Hibernate 7 | ORM giao tiếp cơ sở dữ liệu PostgreSQL |
| **Flyway** | 10.x | Quản lý và tự động hóa migration database |
| **Spring AMQP / RabbitMQ** | 4.3.x | Hệ thống hàng đợi sự kiện bất đồng bộ |
| **Redis / Jedis** | 7.4.x | Bộ nhớ đệm phân tán cho giỏ hàng |
| **ZaloPay SDK / REST** | HMAC-SHA256 | Tích hợp thanh toán trực tuyến Sandbox |
| **JavaMailSender** | Gmail SMTP (TLS) | Dịch vụ gửi email kích hoạt tài khoản |
| **Maven** | 3.9+ | Multi-module project aggregator |

### Frontend (Next.js 16 / React 19)
| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **Next.js** | 16.2.12 | App Router framework hiện đại với SSR & CSR |
| **React** | 19.2.4 | Thư viện UI reactive |
| **TypeScript** | 5.x | Ngôn ngữ kiểu tĩnh an toàn |
| **Tailwind CSS** | 4.0 | Hệ thống thiết kế responsive |
| **Base UI / CVA** | 1.0.0 | Thư viện UI primitives chuẩn accessibility |
| **Lucide React** | 0.475.0 | Bộ icon giao diện hiện đại |

### Hạ tầng (Infrastructure)
| Thành phần | Image Docker | Cổng Host / Container | Chức năng |
|---|---|---|---|
| **PostgreSQL** | `postgres:16.14-alpine` | `5433` (host) / `5432` | Cơ sở dữ liệu tập trung dùng chung `ecommerce_db` |
| **Redis** | `redis:7.4.9-alpine` | `6379:6379` | In-memory Data Store cho Cart Service |
| **RabbitMQ** | `rabbitmq:4.3.3-management-alpine` | `5672:5672` (AMQP)<br>`15672:15672` (Web UI) | Message Broker cho Outbox & Notification |

---

## 📁 Cấu trúc thư mục dự án

```
mini-ecommerce-platform/
├── pom.xml                          # Root POM aggregator (Maven multi-module 8 services)
├── docker-compose.yml               # Docker Compose triển khai toàn bộ hệ thống
├── .env.example                     # Mẫu biến môi trường
├── README.md                        # Tài liệu hướng dẫn chính
│
├── database/                        # Cơ sở dữ liệu tập trung dùng chung
│   ├── README.md                    # Tài liệu hướng dẫn vận hành DB
│   ├── migrations/                  # Versioned SQL migrations (V1 schema, V2 seed)
│   ├── schema/                      # DDL schema phân module (Identity, Catalog, Inventory...)
│   ├── seed/                        # DML seed data (Users, Catalog, Inventory, Coupons)
│   ├── scripts/                     # Shell scripts quản trị (init, reset, backup, restore)
│   ├── init/                        # Entrypoint tự động cho Postgres container
│   └── backup/                      # Thư mục lưu trữ các bản sao lưu
│
├── services/                        # 8 backend microservices
│   ├── api-gateway/                 # Spring Cloud Gateway (Port 8080)
│   ├── identity-service/            # Auth, Users, JWT RS256, Email (Port 8081)
│   ├── catalog-service/             # Products, Brands, Categories, Reviews (Port 8082)
│   ├── inventory-service/           # Stock, Reservations, Locking (Port 8083)
│   ├── cart-service/                # Giỏ hàng Redis TTL 7d (Port 8084)
│   ├── order-service/               # Checkout, Orders, Coupons, Outbox (Port 8085)
│   ├── payment-service/             # ZaloPay Sandbox Gateway (Port 8086)
│   └── notification-service/        # RabbitMQ Order Event Consumer (Port 8087)
│
├── frontend/                        # Next.js 16 Web Application (Port 3000)
│   ├── src/
│   │   ├── app/                     # App Router: Home, Products, Cart, Checkout, Orders, Admin
│   │   ├── components/              # Navbar, MiniCartDrawer, ProductCards, Dialogs, UI primitives
│   │   └── lib/                     # API client, Auth/Cart/Wishlist Contexts, Types, Utils
│   └── package.json
│
├── tests/                           # Hệ thống kiểm thử chuẩn hóa toàn diện (CodeceptJS + Playwright)
│   ├── all.test.js                  # Điều phối chạy toàn bộ test chỉ với 1 lệnh (npm test)
│   ├── auth/                        # Module kiểm thử Xác thực & Phân quyền (Login, Register, RBAC)
│   ├── user/                        # Module kiểm thử Hồ sơ & Quản lý User
│   ├── catalog/                     # Module kiểm thử Danh mục, Sản phẩm, Thương hiệu & Tìm kiếm
│   ├── inventory/                   # Module kiểm thử Tồn kho, Khóa đặt trước & Race Condition (10 threads)
│   ├── cart/                        # Module kiểm thử Giỏ hàng (Thêm, Sửa số lượng, Xóa, Dọn giỏ)
│   ├── order/                       # Module kiểm thử Đặt hàng, Hủy, Trả hàng, State Machine & Trừ kho
│   ├── payment/                     # Module kiểm thử ZaloPay Sandbox, Webhook HMAC-SHA256
│   ├── notification/                # Module kiểm thử Thông báo người dùng & Admin
│   ├── review/                      # Module kiểm thử Đánh giá, Chấm sao & Chống XSS Bình luận
│   ├── shipping/                    # Module kiểm thử Địa chỉ giao hàng & Thông tin liên lạc
│   ├── admin/                       # Module kiểm thử Nghiệp vụ Quản trị (Catalog, Orders, Inventory, Coupons)
│   ├── integration/                 # Module kiểm thử Chu trình Nghiệp vụ Liên hoàn (E2E Business Flow)
│   ├── e2e/                         # Module kiểm thử Giao diện Người dùng trực quan (Customer Journey UI)
│   ├── helpers/                     # CustomHelper (Chai assertions & Crypto HMAC)
│   ├── pages/                       # Page Object Models (POM: login, cart, checkout, admin...)
│   └── data/                        # Test fixtures (JSON accounts, coupons, SQLi/XSS payloads)
│
└── docs/                            # Tài liệu thiết kế & Kiến trúc
    └── diagrams/                    # 12 Sơ đồ Mermaid & PlantUML
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Installation & Execution Guide)

Hệ thống hỗ trợ 2 phương pháp khởi chạy:

---

### Phương pháp 1: Khởi chạy nhanh bằng Docker Compose (Khuyên dùng)

Phương pháp này tự động hóa việc build và chạy toàn bộ 8 microservices, cơ sở dữ liệu PostgreSQL, Redis và RabbitMQ:

```bash
# 1. Sao chép biến môi trường (nếu chưa có)
cp .env.example .env

# 2. Khởi động toàn bộ Backend & Hạ tầng
docker compose up -d --build

# 3. Khởi động Frontend Web App (mở terminal mới)
cd frontend
npm install
npm run dev
```

Truy cập giao diện: **http://localhost:3000**

---

### Phương pháp 2: Cài đặt & Khởi chạy thủ công từng thành phần (Manual Step-by-Step)

Phương pháp này dành cho môi trường phát triển (Development / Debugging), chạy trực tiếp mã nguồn bằng Java / Maven và lệnh hệ thống mà không phụ thuộc vào bất kỳ script tự động nào:

#### 1. Yêu cầu môi trường
- **Java JDK 21+** hoặc **Java 25** (kiểm tra bằng `java -version`)
- **Node.js 20+** & **npm** (kiểm tra bằng `node -v` và `npm -v`)
- **PostgreSQL 16** (Cổng `5433` hoặc `5432`)
- **Redis 7** (Cổng `6379`)
- **RabbitMQ 4** (Cổng `5672` và UI `15672`)

---

#### 2. Khởi động các dịch vụ Hạ tầng (Infrastructure)
Nếu sử dụng Docker chỉ cho hạ tầng lưu trữ:
```bash
docker compose up -d postgres redis rabbitmq
```
*(Hoặc sử dụng PostgreSQL, Redis, RabbitMQ cài đặt trực tiếp trên máy host)*

---

#### 3. Khởi tạo Cơ sở Dữ liệu Thủ công qua `psql`
Sử dụng công cụ dòng lệnh `psql` tiêu chuẩn để tạo cơ sở dữ liệu và nạp schema, seed data:

```bash
# Bước 3.1: Tạo database ecommerce_db (kết nối vào database mặc định postgres)
PGPASSWORD=ecommerce_local psql -h localhost -p 5433 -U ecommerce -d postgres -c "CREATE DATABASE ecommerce_db;"

# Bước 3.2: Chạy DDL khởi tạo toàn bộ 25 bảng, indexes và quan hệ khóa ngoại
PGPASSWORD=ecommerce_local psql -h localhost -p 5433 -U ecommerce -d ecommerce_db -f database/migrations/V1__init_schema.sql

# Bước 3.3: Chạy DML nạp dữ liệu khởi tạo (Users, 28 Thương hiệu, 45 Danh mục, 109 SKU Sản phẩm, Tồn kho, Voucher)
PGPASSWORD=ecommerce_local psql -h localhost -p 5433 -U ecommerce -d ecommerce_db -f database/migrations/V2__seed_data.sql
```

---

#### 4. Biên dịch & Khởi chạy từng Microservice Backend (Spring Boot)

Biên dịch toàn bộ mã nguồn:
```bash
./mvnw clean compile -DskipTests
```

Mở các terminal riêng để khởi chạy các service theo đúng thứ tự logic:

```bash
# Terminal 1: Identity Service (Port 8081 - Quản lý tài khoản, JWT, Auth)
./mvnw spring-boot:run -pl services/identity-service

# Terminal 2: Catalog Service (Port 8082 - Sản phẩm, Thương hiệu, Danh mục, Đánh giá)
./mvnw spring-boot:run -pl services/catalog-service

# Terminal 3: Inventory Service (Port 8083 - Tồn kho, Đặt trước, Khóa lạc quan)
./mvnw spring-boot:run -pl services/inventory-service

# Terminal 4: Cart Service (Port 8084 - Giỏ hàng Redis)
./mvnw spring-boot:run -pl services/cart-service

# Terminal 5: Order Service (Port 8085 - Đặt hàng, Trạng thái đơn, Outbox)
./mvnw spring-boot:run -pl services/order-service

# Terminal 6: Payment Service (Port 8086 - Cổng thanh toán ZaloPay)
./mvnw spring-boot:run -pl services/payment-service

# Terminal 7: Notification Service (Port 8087 - Nhận sự kiện RabbitMQ)
./mvnw spring-boot:run -pl services/notification-service

# Terminal 8: API Gateway (Port 8080 - Cổng định tuyến API tập trung)
./mvnw spring-boot:run -pl services/api-gateway
```

*(Hoặc đóng gói ra file JAR: `./mvnw clean package -DskipTests` và chạy bằng lệnh `java -jar services/<service_name>/target/<service_name>-0.0.1-SNAPSHOT.jar`)*

---

#### 5. Khởi chạy Frontend Web App (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Truy cập giao diện: **http://localhost:3000**

---

## 🔗 Danh sách Cổng truy cập & Endpoints

| Thành phần / Dịch vụ | Cổng Host | URL Truy cập / Health Check |
|---|---|---|
| **Frontend Web App** | `3000` | http://localhost:3000 |
| **API Gateway** | `8080` | http://localhost:8080 |
| **Identity Service** | `8081` | http://localhost:8081/actuator/health |
| **Catalog Service** | `8082` | http://localhost:8082/actuator/health |
| **Inventory Service** | `8083` | http://localhost:8083/actuator/health |
| **Cart Service** | `8084` | http://localhost:8084/actuator/health |
| **Order Service** | `8085` | http://localhost:8085/actuator/health |
| **Payment Service (ZaloPay)** | `8086` | http://localhost:8086/actuator/health |
| **Notification Service** | `8087` | http://localhost:8087/actuator/health |
| **RabbitMQ Management Dashboard** | `15672` | http://localhost:15672 *(user: `ecommerce` / pass: `ecommerce_local`)* |
| **PostgreSQL Database** | `5433` (host) / `5432` | `jdbc:postgresql://localhost:5433/ecommerce_db` *(user: `ecommerce` / pass: `ecommerce_local`)* |
| **Redis Cache** | `6379` | `redis://localhost:6379` |

---

## 🗄️ Quản trị Cơ sở Dữ liệu (Database Operations)

Tất cả các thành phần cơ sở dữ liệu được quản lý tập trung tại thư mục `database/`:

```bash
# 1. Cấp quyền thực thi cho các script (chỉ cần chạy lần đầu)
chmod +x database/scripts/*.sh

# 2. Khởi tạo schema và nạp dữ liệu mẫu ban đầu
./database/scripts/init_db.sh

# 3. Reset sạch toàn bộ database và nạp lại từ đầu
./database/scripts/reset_db.sh

# 4. Sao lưu toàn bộ database ra file .sql.gz
./database/scripts/backup_db.sh

# 5. Phục hồi database từ bản sao lưu
./database/scripts/restore_db.sh database/backup/<backup_file>.sql.gz
```

---

## 🧪 Hướng dẫn Chạy Kiểm thử (Testing Guide)

Hệ thống được trang bị bộ kiểm thử tự động toàn diện bao gồm **E2E UI Testing**, **API Integration Testing**, **Bảo mật (Security/SQLi/XSS)**, và **Đồng thời tồn kho (Concurrency Testing)** bằng **CodeceptJS + Playwright + Axios + Chai**.

---

### 1. Chuẩn bị Môi trường Kiểm thử
Đảm bảo hệ thống Backend (cổng `8080`) và Frontend (cổng `3000`) đang hoạt động:

```bash
# 1. Di chuyển vào thư mục tests
cd tests

# 2. Cài đặt các thư viện kiểm thử
npm install

# 3. Cài đặt trình duyệt Playwright (chỉ cần chạy lần đầu)
npx playwright install chromium
```

---

### 2. Các Lệnh Chạy Kiểm thử (CodeceptJS)

> 💡 **Chế độ hiển thị trình duyệt (Headed Mode)**: Mặc định khi chạy lệnh kiểm thử, hệ thống sử dụng **trình duyệt Chromium đơn instance trực quan** để bạn quan sát từng thao tác. Nếu muốn chạy ẩn nền trong môi trường CI/CD, chỉ cần thêm tiền tố `HEADLESS=true`.

#### 🚀 Chạy toàn bộ hệ thống kiểm thử chỉ với một lệnh duy nhất:
```bash
# 1. Chạy TOÀN BỘ 62 kịch bản (API + Integration + 12 Phân hệ UI trên Chrome)
npm test

# 2. Chạy riêng TOÀN BỘ 12 Phân hệ UI trên Trình duyệt Chrome (Cửa sổ 1280x800, 1 Tab duy nhất)
npm run test:ui

# 3. Chạy toàn bộ ở chế độ chạy ngầm không mở cửa sổ (Headless Mode / CI/CD)
HEADLESS=true npm test
```

#### 📦 Chạy kiểm thử theo từng Module Nghiệp vụ chuyên biệt:

| Lệnh thực thi | Module nghiệp vụ | Nội dung kiểm thử chi tiết |
|---|---|---|
| `npm run test:ui` | **Toàn diện Giao diện (UI)** | Chạy 12 phân hệ UI trực tiếp trên Chrome: Trang chủ, Đăng nhập, Hồ sơ, Tìm kiếm/Lọc, Chi tiết SP, Yêu thích, Giỏ hàng, Thanh toán, Lịch sử đơn, Thông báo, Admin Dashboard, Đăng xuất |
| `npm run test:auth` | **Xác thực & Phân quyền** | Đăng nhập hợp lệ, sai mật khẩu, đăng ký Họ Tên, kiểm tra RBAC 401/403, chống SQL Injection |
| `npm run test:user` | **Quản lý Hồ sơ** | Xem thông tin `/api/users/me`, cập nhật số điện thoại & địa chỉ người dùng |
| `npm run test:catalog` | **Danh mục & Sản phẩm** | Xem chi tiết sản phẩm, cây danh mục phân cấp, 28 thương hiệu, tìm kiếm Tiếng Việt UTF-8 |
| `npm run test:inventory`| **Quản lý Tồn kho** | Tra cứu tồn kho, đặt trước hàng (Reservation), kiểm thử tranh chấp 10 luồng đồng thời |
| `npm run test:cart` | **Giỏ hàng** | Thêm sản phẩm, cập nhật số lượng (PATCH), xóa từng món, xóa sạch toàn bộ giỏ |
| `npm run test:order` | **Đơn hàng & State Machine** | Tạo đơn COD, hủy đơn PENDING, yêu cầu hoàn trả, Admin duyệt đơn và đồng bộ tồn kho |
| `npm run test:payment` | **Cổng thanh toán ZaloPay** | Khởi tạo đơn ZaloPay Sandbox, xác thực Webhook HMAC-SHA256, chống giả mạo chữ ký |
| `npm run test:notification` | **Thông báo hệ thống** | Lấy danh sách thông báo người dùng, đánh dấu đã đọc toàn bộ, thông báo Admin |
| `npm run test:review` | **Đánh giá & Bình luận** | Gửi review chấm 1-5 sao, hỏi đáp sản phẩm, kiểm thử ngăn chặn XSS Injection |
| `npm run test:shipping` | **Địa chỉ Giao hàng** | Kiểm tra định dạng địa chỉ tự do, họ tên người nhận và số điện thoại liên lạc |
| `npm run test:admin` | **Quản trị Hệ thống** | Quản lý Catalog, đơn hàng, tổng quan tồn kho, tạo mã giảm giá (`PERCENT`/`FIXED`), quản lý người dùng |
| `npm run test:integration` | **Tích hợp Liên hoàn** | Luồng nghiệp vụ từ Đăng ký → Mua hàng → Áp mã → Thanh toán → Duyệt đơn → Trừ kho → Hủy → Hoàn kho |
| `npm run test:e2e` | **Trải nghiệm Khách hàng**| Trải nghiệm trực quan trên giao diện Next.js: Đăng nhập → Tìm kiếm → Xem chi tiết → Giỏ hàng |
| `npm run test:report` | **Báo cáo HTML** | Xuất báo cáo trực quan Mochawesome HTML Report |

---

### 3. Báo cáo Chi tiết Hệ thống Kiểm thử Chuẩn hóa (62/62 Passed - 100%)

| STT | Phân hệ / Module | Thư mục kiểm thử | Số kịch bản | Kết quả |
|:---:|---|---|:---:|:---:|
| 1 | **Auth & RBAC** | `tests/auth/` | 8 | ✅ 100% Passed |
| 2 | **User Profile** | `tests/user/` | 2 | ✅ 100% Passed |
| 3 | **Product Catalog** | `tests/catalog/` | 6 | ✅ 100% Passed |
| 4 | **Inventory & Concurrency** | `tests/inventory/` | 3 | ✅ 100% Passed |
| 5 | **Cart Management** | `tests/cart/` | 4 | ✅ 100% Passed |
| 6 | **Order Lifecycle** | `tests/order/` | 5 | ✅ 100% Passed |
| 7 | **Payment Gateway** | `tests/payment/` | 3 | ✅ 100% Passed |
| 8 | **Notification Service** | `tests/notification/`| 3 | ✅ 100% Passed |
| 9 | **Review & Rating** | `tests/review/` | 3 | ✅ 100% Passed |
| 10| **Shipping Validation** | `tests/shipping/` | 1 | ✅ 100% Passed |
| 11| **Admin Management** | `tests/admin/` | 5 | ✅ 100% Passed |
| 12| **Integration Flow** | `tests/integration/` | 1 | ✅ 100% Passed |
| 13| **E2E Customer Journey**| `tests/e2e/` | 1 | ✅ 100% Passed |
| 14| **UI Testing Suite (Chrome)** | `tests/ui/` (12 modules) | 12 | ✅ 100% Passed |
| **Tổng**| **Master Suite Toàn Diện** | **`tests/all.test.js`** | **62** | **✅ 62/62 Passed (100%)** |

> **Ảnh chụp màn hình lỗi (Failure Artifacts)**: Khi có kịch bản test thất bại, hệ thống tự động ghi lại ảnh chụp màn hình tại thư mục `tests/output/*.failed.png` để phục vụ việc phân tích lỗi.

---

### 4. Kiểm thử Backend Microservices (Maven)

Chạy kiểm thử trực tiếp trên mã nguồn Spring Boot:

```bash
# Chạy toàn bộ test trên cả 8 microservices
./mvnw test

# Chạy test trên từng microservice cụ thể:
./mvnw test -pl services/identity-service
./mvnw test -pl services/catalog-service
./mvnw test -pl services/order-service
```

---

## 👤 Tài khoản mẫu đăng nhập (Demo Accounts)

Hệ thống đã nạp sẵn các tài khoản demo qua seed data:

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin` | `Passw0rd!` | Quản trị Sản phẩm, Danh mục, Thương hiệu, Tồn kho, Đơn hàng, Voucher, Người dùng |
| **Khách hàng (Customer)** | `customer` | `Passw0rd!` | Mua hàng, Giỏ hàng, Đặt đơn COD/ZaloPay, Quản lý đơn hàng cá nhân, Đánh giá, Wishlist |

---

## 📜 Giấy phép & Đóng góp
Dự án được xây dựng phục vụ mục đích nghiên cứu, học tập kiến trúc Microservices, DevOps và E-Commerce hiện đại.

