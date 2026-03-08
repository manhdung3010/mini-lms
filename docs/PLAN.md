# Mini LMS - Tài Liệu Kế Hoạch Triển Khai Dự Án

## Mục Lục

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Cấu Trúc Dự Án](#5-cấu-trúc-dự-án)
6. [API Design](#6-api-design)
7. [Business Logic & Validation Rules](#7-business-logic--validation-rules)
8. [Frontend Pages & Components](#8-frontend-pages--components)
9. [Phân Chia Phases Triển Khai](#9-phân-chia-phases-triển-khai)
10. [DevOps & CI/CD](#10-devops--cicd)
11. [Seed Data](#11-seed-data)
12. [Rủi Ro & Giải Pháp](#12-rủi-ro--giải-pháp)

---

## 1. Tổng Quan Dự Án

### Mục tiêu

Xây dựng ứng dụng web **Mini LMS** (Learning Management System) cho phép:

- Quản lý thông tin **Học sinh – Phụ huynh**
- Tạo và lên lịch **Lớp học** cho học sinh
- Quản lý **Subscription** (gói học): khởi tạo, theo dõi buổi đã dùng / còn lại
- Đăng ký học sinh vào lớp với các **business rules** chặt chẽ

### Phạm vi

| Trong phạm vi                          | Ngoài phạm vi                     |
| -------------------------------------- | --------------------------------- |
| CRUD Parents, Students                 | Authentication / Authorization    |
| CRUD Classes, lọc theo ngày            | Payment integration               |
| Đăng ký / Hủy đăng ký lớp học         | Notification system               |
| Quản lý Subscription (gói học)         | Role-based access control         |
| Validation business rules              | Real-time features (WebSocket)    |
| Docker + docker-compose                | Deployment lên cloud              |
| Seed data mẫu                          | Full test coverage                |

---

## 2. Kiến Trúc Hệ Thống

### Kiến trúc tổng thể

Dự án sử dụng **Next.js full-stack** (monorepo), tận dụng API Routes làm backend và React Server Components / Client Components cho frontend.

```
┌─────────────────────────────────────────────────┐
│                   Client Browser                │
│         (React Components + Tailwind CSS)        │
└───────────────────────┬─────────────────────────┘
                        │ HTTP (JSON)
┌───────────────────────▼─────────────────────────┐
│              Next.js App Router                  │
│  ┌─────────────────────────────────────────┐    │
│  │         API Route Handlers              │    │
│  │    /api/parents, /api/students, ...     │    │
│  └──────────────────┬──────────────────────┘    │
│                     │                            │
│  ┌──────────────────▼──────────────────────┐    │
│  │          Service Layer                  │    │
│  │   (Business Logic & Validation)         │    │
│  └──────────────────┬──────────────────────┘    │
│                     │                            │
│  ┌──────────────────▼──────────────────────┐    │
│  │         Prisma ORM (Data Access)        │    │
│  └──────────────────┬──────────────────────┘    │
└─────────────────────┼───────────────────────────┘
                      │ TCP/IP
┌─────────────────────▼───────────────────────────┐
│              PostgreSQL Database                 │
└─────────────────────────────────────────────────┘
```

### Nguyên tắc thiết kế

- **Layer Separation**: Route Handler → Service → Repository (Prisma)
- **Single Responsibility**: Mỗi service xử lý đúng 1 domain
- **Fail Fast**: Validate input ngay đầu request pipeline
- **Dependency Injection**: Service nhận Prisma client qua parameter

---

## 3. Tech Stack

| Layer        | Công nghệ                   | Lý do chọn                                         |
| ------------ | ---------------------------- | --------------------------------------------------- |
| Framework    | **Next.js 15** (App Router)  | Full-stack, SSR/SSG, API Routes, React 19           |
| Language     | **TypeScript**               | Type safety, better DX, maintainability             |
| ORM          | **Prisma**                   | Type-safe queries, migration, seeding               |
| Database     | **PostgreSQL 16**            | Relational data, ACID, mature ecosystem             |
| Validation   | **Zod**                      | Schema validation, type inference, composable       |
| UI Library   | **Tailwind CSS v4**          | Utility-first, rapid prototyping                    |
| UI Component | **shadcn/ui**                | Accessible, customizable, built on Radix UI         |
| State Mgmt   | **TanStack Query (React Query)** | Server state management, caching, refetching   |
| Container    | **Docker + docker-compose**  | Reproducible environment, dễ setup                  |
| Linting      | **ESLint + Prettier**        | Code consistency                                    |

---

## 4. Database Schema

### ER Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   parents    │       │    students      │       │  subscriptions   │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)      │──┐    │ id (PK)          │──┐    │ id (PK)          │
│ name         │  │    │ name             │  │    │ student_id (FK)  │
│ phone        │  └───>│ parent_id (FK)   │  │    │ package_name     │
│ email        │       │ dob              │  │    │ start_date       │
│ created_at   │       │ gender           │  └───>│ end_date         │
│ updated_at   │       │ current_grade    │       │ total_sessions   │
└──────────────┘       │ created_at       │       │ used_sessions    │
                       │ updated_at       │       │ created_at       │
                       └────────┬─────────┘       │ updated_at       │
                                │                 └──────────────────┘
                                │
                       ┌────────▼─────────┐       ┌──────────────────┐
                       │ class_           │       │    classes       │
                       │ registrations    │       ├──────────────────┤
                       ├──────────────────┤       │ id (PK)          │
                       │ id (PK)          │  ┌───>│ name             │
                       │ student_id (FK)  │  │    │ subject          │
                       │ class_id (FK)  ──┼──┘    │ day_of_week      │
                       │ registered_at    │       │ time_slot_start  │
                       │ created_at       │       │ time_slot_end    │
                       │ updated_at       │       │ teacher_name     │
                       └──────────────────┘       │ max_students     │
                                                  │ created_at       │
                                                  │ updated_at       │
                                                  └──────────────────┘
```

### Prisma Schema

```prisma
model Parent {
  id        String   @id @default(cuid())
  name      String
  phone     String
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  students Student[]

  @@map("parents")
}

model Student {
  id           String   @id @default(cuid())
  name         String
  dob          DateTime
  gender       Gender
  currentGrade String   @map("current_grade")
  parentId     String   @map("parent_id")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  parent        Parent              @relation(fields: [parentId], references: [id])
  registrations ClassRegistration[]
  subscriptions Subscription[]

  @@map("students")
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

model Class {
  id            String    @id @default(cuid())
  name          String
  subject       String
  dayOfWeek     DayOfWeek @map("day_of_week")
  timeSlotStart String    @map("time_slot_start")  // "08:00"
  timeSlotEnd   String    @map("time_slot_end")    // "09:30"
  teacherName   String    @map("teacher_name")
  maxStudents   Int       @map("max_students")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  registrations ClassRegistration[]

  @@map("classes")
}

model ClassRegistration {
  id           String   @id @default(cuid())
  studentId    String   @map("student_id")
  classId      String   @map("class_id")
  registeredAt DateTime @default(now()) @map("registered_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  student Student @relation(fields: [studentId], references: [id])
  class   Class   @relation(fields: [classId], references: [id])

  @@unique([studentId, classId])
  @@map("class_registrations")
}

model Subscription {
  id            String   @id @default(cuid())
  studentId     String   @map("student_id")
  packageName   String   @map("package_name")
  startDate     DateTime @map("start_date")
  endDate       DateTime @map("end_date")
  totalSessions Int      @map("total_sessions")
  usedSessions  Int      @default(0) @map("used_sessions")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  student Student @relation(fields: [studentId], references: [id])

  @@map("subscriptions")
}
```

### Quyết định thiết kế quan trọng

| Quyết định | Lý do |
|---|---|
| Tách `time_slot` thành `time_slot_start` + `time_slot_end` | Cho phép kiểm tra overlap chính xác giữa các khung giờ |
| Thêm `registered_at` vào `ClassRegistration` | Cần để tính điều kiện hủy trước/sau 24h |
| `@@unique([studentId, classId])` | Prevent duplicate registration |
| Dùng `cuid()` thay vì auto-increment | An toàn hơn cho distributed systems, không lộ thứ tự |
| Enum `DayOfWeek`, `Gender` | Type safety, tránh magic strings |

---

## 5. Cấu Trúc Dự Án

```
mini-lms/
├── docs/
│   └── PLAN.md                      # Tài liệu này
├── prisma/
│   ├── schema.prisma                # Database schema
│   ├── migrations/                  # Auto-generated migrations
│   └── seed.ts                      # Seed data
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Home / Dashboard
│   │   ├── globals.css              # Global styles
│   │   │
│   │   ├── (dashboard)/             # Route group: UI pages
│   │   │   ├── parents/
│   │   │   │   ├── page.tsx         # List parents
│   │   │   │   ├── new/page.tsx     # Create parent form
│   │   │   │   └── [id]/page.tsx    # Parent detail
│   │   │   ├── students/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── classes/
│   │   │   │   ├── page.tsx         # Weekly schedule view
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── register/page.tsx
│   │   │   └── subscriptions/
│   │   │       ├── page.tsx
│   │   │       ├── new/page.tsx
│   │   │       └── [id]/page.tsx
│   │   │
│   │   └── api/                     # API Route Handlers
│   │       ├── parents/
│   │       │   ├── route.ts         # GET (list), POST
│   │       │   └── [id]/route.ts    # GET (detail), PATCH, DELETE
│   │       ├── students/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── classes/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── register/route.ts  # POST: register student
│   │       ├── registrations/
│   │       │   └── [id]/route.ts          # DELETE: cancel registration
│   │       └── subscriptions/
│   │           ├── route.ts
│   │           └── [id]/
│   │               ├── route.ts
│   │               └── use/route.ts       # PATCH: mark session used
│   │
│   ├── lib/                         # Shared utilities
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── api-response.ts          # Standardized API response helpers
│   │   ├── errors.ts                # Custom error classes
│   │   └── utils.ts                 # General utilities
│   │
│   ├── services/                    # Business logic layer
│   │   ├── parent.service.ts
│   │   ├── student.service.ts
│   │   ├── class.service.ts
│   │   ├── registration.service.ts  # Core business rules
│   │   └── subscription.service.ts
│   │
│   ├── validations/                 # Zod schemas
│   │   ├── parent.schema.ts
│   │   ├── student.schema.ts
│   │   ├── class.schema.ts
│   │   ├── registration.schema.ts
│   │   └── subscription.schema.ts
│   │
│   ├── components/                  # React components
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── main-layout.tsx
│   │   ├── parents/
│   │   │   ├── parent-form.tsx
│   │   │   └── parent-list.tsx
│   │   ├── students/
│   │   │   ├── student-form.tsx
│   │   │   └── student-list.tsx
│   │   ├── classes/
│   │   │   ├── class-form.tsx
│   │   │   ├── weekly-schedule.tsx   # Bảng 7 ngày
│   │   │   └── register-dialog.tsx
│   │   └── subscriptions/
│   │       ├── subscription-form.tsx
│   │       └── subscription-card.tsx
│   │
│   └── types/                       # TypeScript types
│       └── index.ts
│
├── public/                          # Static assets
├── .env                             # Environment variables (git-ignored)
├── .env.example                     # Template env
├── Dockerfile                       # Production Docker image
├── docker-compose.yml               # Full stack compose
├── next.config.ts                   # Next.js config
├── tailwind.config.ts               # Tailwind config
├── tsconfig.json                    # TypeScript config
├── package.json
└── README.md
```

### Nguyên tắc tổ chức code

| Thư mục | Trách nhiệm | Phụ thuộc |
|---|---|---|
| `app/api/` | Parse request, gọi service, trả response | `services/`, `validations/` |
| `services/` | Business logic, orchestration | `lib/prisma` |
| `validations/` | Input validation schemas | Không phụ thuộc |
| `lib/` | Shared utilities, DB client | Không phụ thuộc |
| `components/` | UI rendering, user interaction | `types/` |

**Luồng xử lý request:**

```
Request → Route Handler → Zod Validation → Service → Prisma → Database
                                              ↓
Response ← Route Handler ← Service Result ←──┘
```

---

## 6. API Design

### 6.1 Standardized Response Format

Mọi API response tuân theo format thống nhất:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "total": 10, "page": 1, "limit": 20 }  // optional, for lists
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [...]  // optional, field-level errors
  }
}
```

### 6.2 Endpoints Chi Tiết

#### Parents

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/api/parents` | Tạo phụ huynh | `{ name, phone, email }` | `201 Created` |
| `GET` | `/api/parents` | Danh sách phụ huynh | — | `200 OK` + pagination |
| `GET` | `/api/parents/:id` | Chi tiết phụ huynh (kèm students) | — | `200 OK` |

#### Students

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/api/students` | Tạo học sinh | `{ name, dob, gender, current_grade, parent_id }` | `201 Created` |
| `GET` | `/api/students` | Danh sách học sinh | — | `200 OK` |
| `GET` | `/api/students/:id` | Chi tiết (kèm parent, subscriptions) | — | `200 OK` |

#### Classes

| Method | Endpoint | Description | Request Body / Query | Response |
|---|---|---|---|---|
| `POST` | `/api/classes` | Tạo lớp mới | `{ name, subject, day_of_week, time_slot_start, time_slot_end, teacher_name, max_students }` | `201 Created` |
| `GET` | `/api/classes` | Danh sách lớp | `?day=MONDAY` (optional) | `200 OK` |
| `GET` | `/api/classes/:id` | Chi tiết lớp (kèm students) | — | `200 OK` |

#### ClassRegistrations

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/api/classes/:class_id/register` | Đăng ký học sinh vào lớp | `{ student_id }` | `201 Created` |
| `DELETE` | `/api/registrations/:id` | Hủy đăng ký (có điều kiện hoàn buổi) | — | `200 OK` |

#### Subscriptions

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/api/subscriptions` | Tạo gói học | `{ student_id, package_name, start_date, end_date, total_sessions }` | `201 Created` |
| `GET` | `/api/subscriptions/:id` | Xem trạng thái gói | — | `200 OK` |
| `PATCH` | `/api/subscriptions/:id/use` | Đánh dấu dùng 1 buổi | — | `200 OK` |

### 6.3 HTTP Status Codes

| Code | Ý nghĩa |
|---|---|
| `200` | Thành công |
| `201` | Tạo mới thành công |
| `400` | Validation error / Bad request |
| `404` | Resource not found |
| `409` | Conflict (duplicate, max reached) |
| `422` | Business rule violation |
| `500` | Internal server error |

---

## 7. Business Logic & Validation Rules

### 7.1 Đăng Ký Lớp Học (POST /api/classes/:class_id/register)

Đây là endpoint phức tạp nhất, cần kiểm tra 4 điều kiện:

```
┌─────────────────────────────────────────┐
│      POST /api/classes/:id/register     │
│           { student_id }                │
└──────────────────┬──────────────────────┘
                   │
          ┌────────▼────────┐
          │ 1. Class exists? │──── No ──→ 404 Not Found
          └────────┬────────┘
                   │ Yes
          ┌────────▼─────────────┐
          │ 2. Class full?       │──── Yes ─→ 409 "Class is full"
          │ (count >= max)       │
          └────────┬─────────────┘
                   │ No
          ┌────────▼─────────────────┐
          │ 3. Student has active    │──── No ──→ 422 "No active
          │    subscription?         │            subscription"
          │ (end_date > now AND      │
          │  used < total)           │
          └────────┬─────────────────┘
                   │ Yes
          ┌────────▼──────────────────┐
          │ 4. Schedule conflict?     │──── Yes ─→ 409 "Time slot
          │ (same day_of_week AND     │            conflict"
          │  overlapping time_slot)   │
          └────────┬──────────────────┘
                   │ No conflict
          ┌────────▼──────────┐
          │ Create Registration│
          │ + Increment        │
          │   used_sessions    │
          └───────────────────┘
```

#### Chi tiết kiểm tra overlap time_slot

Hai khung giờ overlap khi:

```
existing.start < new.end AND existing.end > new.start
```

Ví dụ:
- Lớp A: 08:00 - 09:30
- Lớp B: 09:00 - 10:30 → **OVERLAP** (08:00 < 10:30 AND 09:30 > 09:00)
- Lớp C: 09:30 - 11:00 → **OK** (08:00 < 11:00 BUT 09:30 = 09:30, not >)

### 7.2 Hủy Đăng Ký (DELETE /api/registrations/:id)

```
┌──────────────────────────────────┐
│ DELETE /api/registrations/:id    │
└──────────────┬───────────────────┘
               │
      ┌────────▼────────────┐
      │ Registration exists? │──── No ──→ 404
      └────────┬────────────┘
               │ Yes
      ┌────────▼──────────────────────────┐
      │ Calculate: class datetime vs now  │
      │ (day_of_week + time_slot_start    │
      │  of the next occurrence)          │
      └────────┬──────────────────────────┘
               │
      ┌────────▼────────────────────┐
      │ > 24h before class start?   │
      ├────── Yes ──────────────────┤
      │ Delete registration         │
      │ + Decrement used_sessions   │ ──→ 200 "Refunded"
      │   (hoàn buổi)              │
      ├────── No ──────────────────┤
      │ Delete registration         │
      │ (KHÔNG hoàn buổi)          │ ──→ 200 "No refund (< 24h)"
      └────────────────────────────┘
```

### 7.3 Validation Schemas (Zod)

```typescript
// parent.schema.ts
const createParentSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^[0-9+\-\s()]{8,15}$/),
  email: z.string().email(),
});

// student.schema.ts
const createStudentSchema = z.object({
  name: z.string().min(1).max(100),
  dob: z.string().datetime(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  currentGrade: z.string().min(1).max(20),
  parentId: z.string().cuid(),
});

// class.schema.ts
const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(50),
  dayOfWeek: z.enum(["MONDAY", ..., "SUNDAY"]),
  timeSlotStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),  // "HH:mm"
  timeSlotEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  teacherName: z.string().min(1).max(100),
  maxStudents: z.number().int().min(1).max(100),
}).refine(
  (data) => data.timeSlotStart < data.timeSlotEnd,
  { message: "End time must be after start time" }
);

// subscription.schema.ts
const createSubscriptionSchema = z.object({
  studentId: z.string().cuid(),
  packageName: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalSessions: z.number().int().min(1),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: "End date must be after start date" }
);
```

---

## 8. Frontend Pages & Components

### 8.1 Layout Chung

```
┌──────────────────────────────────────────────────────────┐
│  Header: Mini LMS                            [logo]      │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  Sidebar   │              Main Content                   │
│            │                                             │
│  Dashboard │    ┌─────────────────────────────────┐     │
│  Parents   │    │                                 │     │
│  Students  │    │   Page Content Here             │     │
│  Classes   │    │                                 │     │
│  Subscr.   │    │                                 │     │
│            │    └─────────────────────────────────┘     │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

### 8.2 Danh sách Pages

| Route | Page | Mô tả |
|---|---|---|
| `/` | Dashboard | Tổng quan: số parents, students, classes, subscriptions |
| `/parents` | Parent List | Bảng danh sách, search, link tới detail |
| `/parents/new` | Create Parent | Form tạo phụ huynh |
| `/parents/[id]` | Parent Detail | Thông tin + danh sách students |
| `/students` | Student List | Bảng danh sách, filter theo parent |
| `/students/new` | Create Student | Form tạo học sinh (chọn parent) |
| `/students/[id]` | Student Detail | Thông tin + parent + subscriptions + classes |
| `/classes` | Weekly Schedule | **Bảng 7 ngày** hiển thị lớp học |
| `/classes/new` | Create Class | Form tạo lớp |
| `/classes/[id]` | Class Detail | Thông tin lớp + danh sách students đã đăng ký |
| `/classes/[id]/register` | Register Student | Chọn student để đăng ký vào lớp |
| `/subscriptions` | Subscription List | Danh sách gói học |
| `/subscriptions/new` | Create Subscription | Form tạo gói (chọn student) |
| `/subscriptions/[id]` | Subscription Detail | Trạng thái: total vs used, progress bar |

### 8.3 Component Chi Tiết: Weekly Schedule (Trang chính Classes)

Đây là component quan trọng nhất theo yêu cầu:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Weekly Class Schedule                         │
├─────────┬─────────┬─────────┬────────┬────────┬────────┬───────┤
│   MON   │   TUE   │   WED   │  THU   │  FRI   │  SAT   │ SUN  │
├─────────┼─────────┼─────────┼────────┼────────┼────────┼───────┤
│┌───────┐│         │┌───────┐│        │        │┌──────┐│       │
││Math   ││         ││English││        │        ││Art   ││       │
││08:00- ││         ││08:00- ││        │        ││09:00-││       │
││09:30  ││         ││09:30  ││        │        ││10:30 ││       │
││Mr.Tuan││         ││Ms.Hoa ││        │        ││Mr.An ││       │
││5/20 ✓ ││         ││18/20  ││        │        ││10/15 ││       │
│└───────┘│         │└───────┘│        │        │└──────┘│       │
│┌───────┐│┌───────┐│         │┌──────┐│        │        │       │
││Science││Physics ││         ││Music ││        │        │       │
││10:00- ││10:00- ││         ││14:00-││        │        │       │
││11:30  ││11:30  ││         ││15:30 ││        │        │       │
││Ms.Mai ││Mr.Nam ││         ││Ms.Thu││        │        │       │
││12/15  ││8/20   ││         ││6/10  ││        │        │       │
│└───────┘│└───────┘│         │└──────┘│        │        │       │
└─────────┴─────────┴─────────┴────────┴────────┴────────┴───────┘
```

Mỗi class card hiển thị:
- Tên lớp + Môn học
- Khung giờ (time_slot)
- Giáo viên
- Sĩ số hiện tại / max
- Màu badge: xanh (còn chỗ), đỏ (hết chỗ)

### 8.4 UX Patterns

| Pattern | Áp dụng |
|---|---|
| **Optimistic Updates** | Khi đăng ký/hủy lớp, UI update trước khi server confirm |
| **Toast Notifications** | Thông báo thành công/lỗi từ API |
| **Loading Skeletons** | Khi fetch data, hiện skeleton thay vì spinner |
| **Form Validation** | Client-side validation bằng Zod (cùng schema với server) |
| **Confirmation Dialog** | Trước khi hủy đăng ký, xác nhận với user |
| **Empty States** | Khi không có data, hiện hướng dẫn tạo mới |

---

## 9. Phân Chia Phases Triển Khai

### Phase 1: Foundation (Ước lượng: 3-4h)

**Mục tiêu**: Setup project, database, core infrastructure

| # | Task | Chi tiết | Output |
|---|---|---|---|
| 1.1 | Init Next.js project | `create-next-app` với TypeScript, Tailwind, App Router | Boilerplate |
| 1.2 | Setup Prisma + PostgreSQL | Install Prisma, viết schema, generate client | Schema + migration |
| 1.3 | Setup shadcn/ui | Init shadcn, add base components (Button, Input, Table, Dialog, Form, Card, Toast) | UI foundation |
| 1.4 | Shared utilities | `prisma.ts`, `api-response.ts`, `errors.ts` | lib/ |
| 1.5 | Main layout | Sidebar, Header, responsive layout | Layout shell |
| 1.6 | Docker setup | Dockerfile, docker-compose.yml, .env.example | Docker files |

### Phase 2: Core CRUD (Ước lượng: 5-6h)

**Mục tiêu**: Implement all basic CRUD operations

| # | Task | Chi tiết | Output |
|---|---|---|---|
| 2.1 | Parents API + UI | POST, GET (list + detail), Form, List page | Full Parent feature |
| 2.2 | Students API + UI | POST, GET (kèm parent info), Form (chọn parent), List | Full Student feature |
| 2.3 | Classes API + UI | POST, GET (filter by day), Form, **Weekly Schedule view** | Full Class feature |
| 2.4 | Subscriptions API + UI | POST, GET, PATCH /use, Form (chọn student), Status card | Full Subscription feature |

### Phase 3: Business Logic (Ước lượng: 4-5h)

**Mục tiêu**: Implement registration with all business rules

| # | Task | Chi tiết | Output |
|---|---|---|---|
| 3.1 | Registration Service | Core validation logic (4 checks), unit-testable | `registration.service.ts` |
| 3.2 | Register API | POST /api/classes/:id/register with full validation | API endpoint |
| 3.3 | Cancel API | DELETE /api/registrations/:id with 24h refund logic | API endpoint |
| 3.4 | Registration UI | Dialog chọn student, hiển thị validation errors | Register dialog |
| 3.5 | Integration | Wire registration into Class detail page, Student detail | Connected UI |

### Phase 4: Polish & DevOps (Ước lượng: 3-4h)

**Mục tiêu**: Hoàn thiện, seed data, documentation

| # | Task | Chi tiết | Output |
|---|---|---|---|
| 4.1 | Seed data | 2 parents, 3 students, 2-3 classes, subscriptions | `prisma/seed.ts` |
| 4.2 | Dashboard page | Tổng quan stats | Homepage |
| 4.3 | Error handling | Global error boundary, toast notifications | Polished UX |
| 4.4 | Docker verify | Test full stack via docker-compose | Verified deployment |
| 4.5 | README.md | Setup guide, schema docs, API docs, examples | Documentation |
| 4.6 | (Optional) Postman | Collection cho tất cả API endpoints | Postman JSON |

### Timeline Tổng Thể

```
Phase 1 ████████░░░░░░░░░░░░░░░░░░░░░░░░ 3-4h
Phase 2 ░░░░░░░░████████████████░░░░░░░░░ 5-6h
Phase 3 ░░░░░░░░░░░░░░░░░░░░░░██████████░ 4-5h
Phase 4 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████ 3-4h
         ─────────────────────────────────
         Total: ~15-19h (trong giới hạn 36h)
```

---

## 10. DevOps & CI/CD

### 10.1 Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

### 10.2 docker-compose.yml

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: lms_user
      POSTGRES_PASSWORD: lms_password
      POSTGRES_DB: mini_lms
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lms_user -d mini_lms"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://lms_user:lms_password@db:5432/mini_lms
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
```

### 10.3 Chạy dự án

```bash
# Development (local)
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Production (Docker)
docker-compose up --build -d
docker-compose exec app npx prisma db seed   # seed data
# Truy cập: http://localhost:3000
```

---

## 11. Seed Data

### Parents (2)

| name | phone | email |
|---|---|---|
| Nguyễn Văn An | 0901234567 | an.nguyen@email.com |
| Trần Thị Bình | 0912345678 | binh.tran@email.com |

### Students (3)

| name | dob | gender | grade | parent |
|---|---|---|---|---|
| Nguyễn Minh Khoa | 2015-03-15 | MALE | 5 | Nguyễn Văn An |
| Nguyễn Thị Lan | 2017-08-22 | FEMALE | 3 | Nguyễn Văn An |
| Trần Đức Hùng | 2016-01-10 | MALE | 4 | Trần Thị Bình |

### Classes (3)

| name | subject | day | time | teacher | max |
|---|---|---|---|---|---|
| Toán Nâng Cao | Math | MONDAY | 08:00-09:30 | Thầy Tuấn | 20 |
| Tiếng Anh Giao Tiếp | English | WEDNESDAY | 08:00-09:30 | Cô Hoa | 15 |
| Khoa Học Tự Nhiên | Science | MONDAY | 10:00-11:30 | Cô Mai | 15 |

### Subscriptions (2)

| student | package | start | end | total | used |
|---|---|---|---|---|---|
| Nguyễn Minh Khoa | Gói Học Kỳ 1 | 2026-01-01 | 2026-06-30 | 40 | 5 |
| Trần Đức Hùng | Gói 3 Tháng | 2026-02-01 | 2026-04-30 | 24 | 2 |

---

## 12. Rủi Ro & Giải Pháp

| Rủi ro | Mức độ | Giải pháp |
|---|---|---|
| Overlap time_slot logic phức tạp | Trung bình | So sánh string "HH:mm" (vì format chuẩn, so sánh lexicographic hoạt động đúng) |
| Race condition khi đăng ký đồng thời | Thấp (demo app) | Dùng Prisma transaction + unique constraint |
| Tính toán "next occurrence" cho hủy 24h | Trung bình | Dùng thư viện `date-fns` để tính ngày tiếp theo của day_of_week |
| Performance với nhiều registrations | Thấp (demo app) | Index trên `class_id`, `student_id` |
| Docker build chậm | Thấp | Multi-stage build, layer caching |

---

## Phụ Lục: Checklist Hoàn Thành

- [ ] Database schema hoàn chỉnh + migrations
- [ ] API: POST/GET Parents
- [ ] API: POST/GET Students (kèm parent info)
- [ ] API: POST/GET Classes (filter by day)
- [ ] API: POST register + full business validation
- [ ] API: DELETE registration + 24h refund logic
- [ ] API: POST/GET/PATCH Subscriptions
- [ ] UI: Form tạo Parent & Student
- [ ] UI: Weekly Schedule (bảng 7 ngày)
- [ ] UI: Đăng ký student vào class
- [ ] Seed data: 2 parents, 3 students, 2-3 classes
- [ ] Dockerfile + docker-compose.yml
- [ ] README.md đầy đủ
- [ ] (Optional) Postman collection
