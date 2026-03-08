# Mini LMS

Ứng dụng web quản lý học tập (Learning Management System): quản lý Phụ huynh – Học sinh, Lớp học, Đăng ký lớp và Gói học (Subscription).

**Tech:** Next.js 16, TypeScript, Prisma, PostgreSQL, Tailwind CSS, shadcn/ui.

---

## Yêu cầu

- **Node.js** 18+ (khuyến nghị 20+)
- **npm** hoặc pnpm / yarn
- **Docker** & **Docker Compose** (để chạy PostgreSQL nếu chưa cài sẵn)

---

## Cài đặt

```bash
# Clone (nếu chưa có)
git clone <repo-url>
cd mini-lms

# Cài dependency
npm install
```

---

## Cấu hình

Tạo file `.env` từ mẫu và chỉnh nếu cần:

```bash
cp .env.example .env
```

Nội dung mặc định (PostgreSQL qua Docker hoặc local):

```env
DATABASE_URL="postgresql://lms_user:lms_password@localhost:5432/mini_lms?schema=public"
```

---

## Chạy dự án

### 1. Bật PostgreSQL

**Cách A – Dùng Docker (khuyến nghị nếu chưa cài Postgres):**

```bash
npm run db:docker:up
```

Chạy container PostgreSQL (port `5432`). Dừng khi không dùng: `npm run db:docker:down`.

**Cách B – Postgres đã cài sẵn trên máy:**

- Tạo database `mini_lms` và user tương ứng (hoặc dùng user/password trong `.env`).
- Đảm bảo `.env` trỏ đúng host/port/user/password.

### 2. Tạo schema và dữ liệu mẫu

```bash
# Áp schema lên DB (tạo/cập nhật bảng)
npx prisma db push

# (Tùy chọn) Seed dữ liệu mẫu
npm run db:seed
```

### 3. Chạy ứng dụng

```bash
# Development
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

---

## Scripts thường dùng

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Chạy Next.js dev server |
| `npm run build` | Build production |
| `npm run start` | Chạy bản build (sau `npm run build`) |
| `npm run db:docker:up` | Chạy PostgreSQL bằng Docker |
| `npm run db:docker:down` | Dừng container PostgreSQL |
| `npm run db:push` | Đồng bộ schema Prisma → DB |
| `npm run db:migrate` | Chạy migration (tạo file migration) |
| `npm run db:seed` | Seed dữ liệu mẫu |
| `npm run db:studio` | Mở Prisma Studio (xem/sửa DB) |
| `npm run db:generate` | Generate Prisma Client |
| `npm run docker:up` | Chạy full stack (DB + app) bằng Docker |
| `npm run docker:down` | Dừng toàn bộ Docker Compose |
| `npm run docker:seed` | Seed DB trong container app |
| `npm run docker:logs` | Xem logs container app |

---

## Cấu trúc thư mục chính

```
mini-lms/
├── prisma/
│   ├── schema.prisma   # Định nghĩa model DB
│   └── seed.ts        # Script seed
├── src/
│   ├── app/            # Next.js App Router (pages, layout, API)
│   │   ├── api/        # API routes
│   │   ├── parents/    # Trang quản lý phụ huynh
│   │   ├── students/   # Trang quản lý học sinh
│   │   ├── classes/    # Trang quản lý lớp học
│   │   └── subscriptions/
│   ├── components/     # React components (layout, ui)
│   └── lib/            # Prisma client, API helpers, utils
├── docker-compose.yml  # PostgreSQL + app (optional)
└── Dockerfile          # Build image app
```

---

## Chạy full stack bằng Docker

Chạy cả PostgreSQL và app trong container:

```bash
docker compose up -d
```

- App: [http://localhost:3000](http://localhost:3000)
- DB: port `5432` (chỉ dùng trong mạng Docker; từ máy host dùng `localhost:5432` nếu map port).

---

## Tài liệu thêm

- [docs/PLAN.md](docs/PLAN.md) – Kế hoạch triển khai, kiến trúc, API, business rules.
