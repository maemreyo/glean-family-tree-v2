# Trạng thái Triển khai Hiện tại (Current Implementation)

*Cập nhật lần cuối: 2026-01-27*

Tài liệu này cung cấp cái nhìn tổng quan và chi tiết về trạng thái hiện tại của dự án `glean-family-tree-v2`.

## 1. Tổng quan

- **Tên dự án**: Glean Family Tree V2
- **Phiên bản**: 0.1.0
- **Trạng thái**: Đang phát triển (In Development)
- **Mô hình triển khai**: 3-Tier (Preview -> Staging -> Production)
  - **Staging**: Chạy trên Supabase Project `lfaubupwqmujwpwckpfj` (Mới tạo)
  - **Production**: Chạy trên Supabase Project `vcsjsqkjopcawdenncfn` (Project cũ, tái sử dụng)

## 2. Cấu trúc Codebase

Cấu trúc thư mục chính và vai trò của từng phần:

```
/
├── .env.local                  # Biến môi trường (chứa cả Staging & Prod keys)
├── app/                        # Next.js App Router (Source of Truth cho Routing)
│   ├── auth/                   # Xử lý Auth Callback (confirm route)
│   ├── dashboard/              # Giao diện chính (Protected Routes)
│   │   ├── layout.tsx          # Layout Dashboard (Sidebar, Header)
│   │   ├── page.tsx            # Entry point (Server Component)
│   │   └── DashboardClient.tsx # Logic chính (Client Component)
│   ├── login/                  # Trang đăng nhập
│   ├── layout.tsx              # Root Layout (Providers: Query, UI Store)
│   └── page.tsx                # Landing Page
├── components/                 # React Components
│   ├── landing/                # Components cho Landing Page (Hero, Features...)
│   ├── ui/                     # Shadcn UI Components (Button, Input, Card...)
│   ├── FamilyTree.tsx          # Component hiển thị cây gia phả (ReactFlow)
│   └── RelationshipModal.tsx   # Modal tạo/sửa mối quan hệ
├── lib/                        # Logic & Utilities
│   ├── supabase/               # Supabase Integration
│   │   ├── client.ts           # Client-side Supabase client
│   │   ├── middleware.ts       # Middleware xử lý Auth & Session
│   │   ├── server.ts           # Server-side Supabase client
│   │   └── queries.ts          # React Query hooks (API logic)
│   └── utils.ts                # Helper functions (cn for Tailwind)
├── providers/                  # Context Providers
│   ├── query-provider.tsx      # TanStack Query Provider
│   └── ui-store-provider.tsx   # Zustand Store Provider (Context wrapper)
├── stores/                     # State Management (Zustand)
│   └── ui-store.ts             # UI State (Sidebar, Modals, Tree View settings)
├── store/                      # [LEGACY] Thư mục cũ, cần dọn dẹp
│   └── use-tree-store.ts       # [UNUSED] Global store cũ
├── types/                      # TypeScript Definitions
│   └── supabase.ts             # Database Schema Types (Generated)
└── docs/                       # Tài liệu dự án
```

## 3. Trạng thái Triển khai Chi tiết

### 3.1. Authentication & Security
| Tính năng | Trạng thái | Chi tiết |
|-----------|------------|----------|
| **Supabase Auth** | ✅ Hoàn thành | Tích hợp Email/Password login. |
| **Middleware** | ✅ Hoàn thành | Bảo vệ route `/dashboard`, refresh session token. |
| **RLS Policies** | ✅ Hoàn thành | Policies cho bảng `persons` và `relationships` (Select/Insert/Update/Delete cho authenticated users). |
| **Environment** | ✅ Hoàn thành | Đã config `.env.local` hỗ trợ chuyển đổi nhanh giữa Staging/Prod. |

### 3.2. Core Features (Dashboard)
| Thành phần | File | Trạng thái | Ghi chú |
|------------|------|------------|---------|
| **Dashboard Layout** | `app/dashboard/page.tsx` | ✅ Hoàn thành | Server Component, fetch data ban đầu (prefetch). |
| **Dashboard Logic** | `app/dashboard/DashboardClient.tsx` | ✅ Hoàn thành | Client Component, quản lý state, realtime subscription, CRUD operations. |
| **Quản lý Persons** | `lib/supabase/queries.ts` | ✅ Hoàn thành | Hỗ trợ Create, Read, Delete (Soft/Hard delete cần kiểm tra lại). |
| **Quản lý Relationships** | `components/RelationshipModal.tsx` | ⚠️ Cơ bản | Đã có chức năng tạo Parent-Child. UI đang dùng native select, chưa tối ưu UX. |

### 3.3. Visualization (Family Tree)
| Tính năng | Công nghệ | Trạng thái | Ghi chú |
|-----------|-----------|------------|---------|
| **Hiển thị Cây** | ReactFlow | ✅ Hoàn thành | Render nodes (Person) và edges (Relationship). |
| **Auto Layout** | Dagre | ✅ Hoàn thành | Tự động sắp xếp vị trí node theo phân cấp. |
| **Interactivity** | ReactFlow | ⚠️ Cơ bản | Zoom, Pan hoạt động. Chưa có click node để xem chi tiết/edit. |

### 3.4. State Management
| Loại State | Thư viện | Pattern | Trạng thái |
|------------|----------|---------|------------|
| **Server State** | React Query | Custom Hooks | ✅ Ổn định. Tách biệt logic fetch data khỏi UI. |
| **UI State** | Zustand | Factory + Context | ✅ Ổn định. Tránh lỗi SSR hydration mismatch. |

### 3.5. Database Schema
- **Tables**: `persons`, `relationships`
- **Migrations**: Script `SETUP_SUPABASE.sql` đã được cập nhật để chạy idempotent (kiểm tra tồn tại trước khi tạo).
- **Realtime**: Đã bật cho cả 2 bảng.

## 4. Các Vấn đề & Công việc Tồn đọng (Issues & Backlog)

### 4.1. Cleanup & Refactor
- [ ] **Delete Legacy Code**: Xóa thư mục `store/` và file `use-tree-store.ts` (đang dùng `stores/ui-store.ts`).
- [ ] **Consistency**: Chuẩn hóa dùng Shadcn UI components (Select, Dialog) thay vì native HTML elements trong `RelationshipModal`.

### 4.2. Features cần cải thiện
- [ ] **Relationship Types**: Hiện tại mới chỉ tập trung vào quan hệ cha-con (parent-child). Cần mở rộng cho vợ-chồng (spouse).
- [ ] **Node Editing**: Cho phép click vào node trên cây để sửa thông tin hoặc thêm quan hệ nhanh.
- [ ] **Validation**: Kiểm tra vòng lặp quan hệ (người A là cha người B, người B là cha người A).

### 4.3. Infrastructure
- [ ] **CI/CD**: Chưa thiết lập GitHub Actions để auto deploy lên Vercel khi push vào nhánh `staging` hoặc `main`.

## 5. Phụ thuộc & Cấu hình

### Core Dependencies
- `next`: 15.1.3
- `react`: 19.0.0
- `@supabase/ssr`: ^0.5.2
- `@tanstack/react-query`: ^5.62.11
- `zustand`: ^5.0.3
- `reactflow`: ^11.11.4
- `dagre`: ^0.8.5

### Environment Variables
Các biến cần thiết trong `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(Hiện tại file này đang chứa comment cho cả 2 môi trường để dễ switch).
