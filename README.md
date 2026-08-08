# Mini E-Commerce Platform

Nền tảng thương mại điện tử quy mô nhỏ (**Mini E-Commerce**) được xây dựng theo kiến trúc **microservices**. Hệ thống bao gồm **6 backend service** (Java/Spring Boot) được điều phối bởi một **API Gateway**, một **frontend** (Next.js), cùng hạ tầng PostgreSQL, Redis và RabbitMQ.

---

## 🧱 Tổng quan kiến trúc

```
                        ┌─────────────────────────────┐
                        │        Frontend (Next.js)   │
                        │        http://localhost:3000│
                        └──────────────┬──────────────┘
                                       │  HTTP (REST + JWT Bearer)
                        ┌──────────────▼──────────────┐
                        │        API Gateway          │
                        │        http://localhost:8080 │
                        └──────┬──────┬──────┬─────┬──┴──────┬──────┐
                               │      │      │     │         │      │
                    ┌──────────▼──┐ ┌──▼──────▼─┐ ┌▼───────┐ ┌▼───────┐
                    │   Identity  │ │  Catalog  │ │ Cart   │ │Order/  │
                    │   Service   │ │  Service  │ │Service │ │Inventory│
                    │   :8081     │ │  :8082    │ │ :8084  │ │:8085/:8083
                    └─────────────┘ └───────────┘ └────────┘ └────────┘
```

- **API Gateway** — điểm vào duy nhất, định tuyến request tới từng service theo đường dẫn.
- **Identity Service** — xác thực/đăng ký, phát hành JWT (RSA).
- **Catalog Service** — quản lý sản phẩm, danh mục.
- **Inventory Service** — tồn kho sản phẩm, đặt giữ hàng (reservation).
- **Cart Service** — giỏ hàng (lưu trên Redis).
- **Order Service** — tạo đơn hàng, thanh toán (checkout), phát sự kiện qua RabbitMQ.

---

## 🛠 Ngôn ngữ & Công nghệ

### Backend

| Công nghệ                                | Phiên bản                               |
| ---------------------------------------- | --------------------------------------- |
| Java                                     | 25 (Temurin)                            |
| Spring Boot                              | 4.1.0                                   |
| Spring Security + OAuth2 Resource Server | Có                                      |
| Spring Data JPA (Hibernate)              | Có                                      |
| Flyway                                   | Quản lý migration cơ sở dữ liệu         |
| Spring AMQP / RabbitMQ                   | Trao đổi sự kiện (order-event)          |
| Resilience4j                             | Circuit breaker + retry cho gọi service |
| Testcontainers + WireMock                | Kiểm thử tích hợp                       |
| Maven                                    | Build (multi-module aggregator)         |

### Frontend

| Công nghệ    | Phiên bản |
| ------------ | --------- |
| Next.js      | 16.2.12   |
| React        | 19.2.4    |
| TypeScript   | 5.x       |
| Tailwind CSS | 4.x       |
| shadcn/ui    | 4.x       |
| lucide-react | 1.x       |

### Hạ tầng

| Thành phần              | Phiên bản               | Cổng                           |
| ----------------------- | ----------------------- | ------------------------------ |
| PostgreSQL              | 16.14-alpine            | 5433 (host) / 5432 (container) |
| Redis                   | 7.4.9-alpine            | 6379                           |
| RabbitMQ (+ Management) | 4.3.3-management-alpine | 5672 / 15672                   |

---

## 📁 Cấu trúc thư mục

```
mini-ecommerce-platform/
├── pom.xml                          # Root POM aggregator (Maven multi-module)
├── mvnw                             # Maven wrapper
├── docker-compose.yml               # Khởi chạy toàn bộ hạ tầng + services
├── .env.example                     # Mẫu biến môi trường
├── .dockerignore
├── .gitignore
├── README.md                        # Tài liệu này
│
├── services/                        # 6 backend microservices
│   ├── api-gateway/                 # Spring Cloud Gateway (port 8080)
│   ├── identity-service/            # Auth & users (port 8081)
│   ├── catalog-service/             # Sản phẩm & danh mục (port 8082)
│   ├── inventory-service/           # Tồn kho & reservation (port 8083)
│   ├── cart-service/                # Giỏ hàng Redis (port 8084)
│   └── order-service/               # Đơn hàng & checkout (port 8085)
│
├── frontend/                        # Next.js frontend (port 3000)
│   └── src/
│       ├── app/                     # Pages (Next.js App Router)
│       │   ├── page.tsx             # Trang chủ (danh sách sản phẩm)
│       │   ├── login/page.tsx       # Đăng nhập
│       │   ├── register/page.tsx    # Đăng ký
│       │   ├── cart/page.tsx        # Giỏ hàng
│       │   ├── checkout/page.tsx    # Thanh toán
│       │   ├── orders/              # Danh sách & chi tiết đơn hàng
│       │   └── admin/               # Trang quản trị
│       ├── components/              # Components (navbar, dialogs, ui/...)
│       └── lib/                     # API client, contexts, hooks, types, utils
│
├── infrastructure/
│   ├── postgres/init/               # Script tạo database (01-create-databases.sql)
│   ├── monitoring/                  # Prometheus & Grafana
│   └── rabbitmq/
│
├── scripts/                         # Scripts hỗ trợ
└── docs/                            # (Tài liệu — đã gỡ khỏi repo)
```

### Cấu trúc một backend service (ví dụ `order-service`)

```
services/order-service/
├── pom.xml
├── Dockerfile
├── mvnw / mvnw.cmd
└── src/
    ├── main/
    │   ├── java/com/miniecommerce/order/
    │   │   ├── checkout/            # CheckoutController, CheckoutService, ...
    │   │   ├── order/               # Order entity, repository, service, controller
    │   │   ├── client/              # RestClient gọi catalog/inventory/cart
    │   │   ├── messaging/           # RabbitMQ publisher, outbox
    │   │   ├── idempotency/         # Chống trùng lặp request
    │   │   └── shared/              # Config, exception, security
    │   └── resources/
    │       ├── application.yml
    │       ├── db/migration/        # Flyway migration
    │       └── keys/                # Khóa RSA cho JWT (public.pem)
    └── test/                        # Integration tests (Testcontainers)
```

---

## 🚀 Cài đặt & Setup

### Yêu cầu tiên quyết

- **Docker + Docker Compose** (để chạy PostgreSQL, Redis, RabbitMQ và các service)
- **JDK 25** (Temurin)
- **Maven 3.9+** (hoặc dùng `./mvnw`)
- **Node.js 20+** và **npm**
- **Git**

### Bước 1 — Cấu hình biến môi trường

Tạo file `.env` từ mẫu (nếu chưa có):

```bash
cp .env.example .env
```

Các biến mặc định (đã khớp với cấu hình trong `application*.yml`):

```
POSTGRES_USER=ecommerce
POSTGRES_PASSWORD=ecommerce_local
RABBITMQ_USER=ecommerce
RABBITMQ_PASSWORD=ecommerce_local
```

### Bước 2 — Khởi chạy hạ tầng

Từ thư mục gốc, chạy tất cả (hạ tầng + 6 service) bằng Docker Compose:

```bash
docker compose up -d --build
```

> ⚠️ Lần đầu build sẽ mất nhiều thời gian (tải dependency + build JAR). Sau đó các service tự chạy.

Chỉ khởi động riêng hạ tầng (để chạy service bằng Maven):

```bash
docker compose up -d postgres redis rabbitmq
```

### Bước 3 — (Tùy chọn) Chạy backend bằng Maven trực tiếp

Mỗi service là một module Maven. Ví dụ chạy `order-service`:

```bash
cd services/order-service
../mvnw spring-boot:run
```

Hoặc build toàn bộ từ gốc:

```bash
./mvnw clean install -DskipTests
```

### Bước 4 — Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định trỏ API Gateway tại `http://localhost:8080` (có thể đổi qua biến `NEXT_PUBLIC_API_BASE`).

---

## 🏃 Cách chạy dự án (tóm tắt)

| Cách                 | Lệnh                                        | Ghi chú                      |
| -------------------- | ------------------------------------------- | ---------------------------- |
| **Toàn bộ hệ thống** | `docker compose up -d --build`              | Hạ tầng + 6 service đóng gói |
| **Backend (dev)**    | `./mvnw spring-boot:run` trong từng service | Cần hạ tầng đã chạy          |
| **Frontend**         | `cd frontend && npm run dev`                | Mở `http://localhost:3000`   |

---

## 🐳 Build từng service bằng Docker (khi sửa backend)

Mỗi service có `Dockerfile` riêng trong `services/<tên-service>/Dockerfile`. Build context luôn là **thư mục gốc repo** (vì cần root `pom.xml` aggregator), nên bạn phải chạy lệnh `docker build` từ gốc với `-f` (file) trỏ tới Dockerfile của service.

### Build tất cả service

```bash
docker compose build
```

### Build 1 service cụ thể

```bash
# Cú pháp chung (chạy từ thư mục gốc repo)
docker build -f services/<tên-service>/Dockerfile -t mini-ecommerce/<tên-service>:latest .
```

Ví dụ build từng service:

| Service               | Lệnh build                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| **api-gateway**       | `docker build -f services/api-gateway/Dockerfile -t mini-ecommerce/api-gateway:latest .`             |
| **identity-service**  | `docker build -f services/identity-service/Dockerfile -t mini-ecommerce/identity-service:latest .`   |
| **catalog-service**   | `docker build -f services/catalog-service/Dockerfile -t mini-ecommerce/catalog-service:latest .`     |
| **inventory-service** | `docker build -f services/inventory-service/Dockerfile -t mini-ecommerce/inventory-service:latest .` |
| **cart-service**      | `docker build -f services/cart-service/Dockerfile -t mini-ecommerce/cart-service:latest .`           |
| **order-service**     | `docker build -f services/order-service/Dockerfile -t mini-ecommerce/order-service:latest .`         |

### Chạy lại 1 service sau khi sửa backend

Sau khi sửa code backend của một service, chỉ cần **build + chạy lại service đó** (không cần dựng lại toàn bộ):

```bash
# Build lại đúng service đã sửa
docker compose build <tên-service>

# Chạy lại service đó (giữ nguyên các service khác + hạ tầng)
docker compose up -d <tên-service>
```

Ví dụ sửa `order-service`:

```bash
docker compose build order-service
docker compose up -d order-service
```

> 💡 **Mẹo:** Trong quá trình phát triển, nếu chỉ sửa source backend, bạn có thể chạy service bằng Maven trực tiếp (`../mvnw spring-boot:run`) cho nhanh mà không cần build image. Dùng Docker build khi cần đóng gói / chạy giống môi trường production.

### Các cổng truy cập

| Thành phần                 | URL                                     |
| -------------------------- | --------------------------------------- |
| Frontend                   | http://localhost:3000                   |
| API Gateway                | http://localhost:8080                   |
| Identity Service           | http://localhost:8081                   |
| Catalog Service            | http://localhost:8082                   |
| Inventory Service          | http://localhost:8083                   |
| Cart Service               | http://localhost:8084                   |
| Order Service              | http://localhost:8085                   |
| RabbitMQ Management        | http://localhost:15672                  |
| Health check (mỗi service) | http://localhost:<port>/actuator/health |

### Tài khoản demo (đã seed tự động qua Flyway)

| Vai trò    | Username   | Password    |
| ---------- | ---------- | ----------- |
| Admin      | `admin`    | `Passw0rd!` |
| Khách hàng | `customer` | `Passw0rd!` |

---

## 🧪 Kiểm thử

Chạy kiểm thử tích hợp (Testcontainers — cần Docker):

```bash
./mvnw test
```

Hoặc kiểm thử riêng từng service:

```bash
cd services/order-service && ../mvnw test
```

---

## 📡 Luồng nghiệp vụ chính

1. **Đăng nhập/Đăng ký** → Identity Service phát hành JWT.
2. **Xem sản phẩm** → Catalog Service (qua Gateway).
3. **Thêm vào giỏ** → Cart Service (lưu Redis, cần JWT).
4. **Checkout / Đặt hàng** → Order Service:
   - Kiểm tra tồn kho qua Inventory Service (Resilience4j).
   - Tạo đơn hàng + ghi Outbox.
   - Phát sự kiện `order-event` qua RabbitMQ.
5. **Quản trị** → Admin quản lý sản phẩm, tồn kho, trạng thái đơn hàng.

---

## 📝 Ghi chú

- JWT được ký bằng **RSA** (cặp khóa trong `services/*/resources/keys/`). `public.pem` được dùng chung để các service xác thực token.
- Schema quản lý bằng **Flyway** (`db/migration/V1__...`, `V2__seed...`).
- Các test dùng **Testcontainers** nên cần Docker đang chạy khi `mvn test`.
- File `.env` (chứa thông tin nhạy cảm) **không** được commit — luôn dùng `.env.example`.
