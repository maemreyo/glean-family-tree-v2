# Trạng thái Triển khai Hiện tại (Current Implementation)

*Cập nhật lần cuối: 2026-01-28*

Tài liệu này cung cấp cái nhìn tổng quan và chi tiết về trạng thái hiện tại của dự án `glean-family-tree-v2`.

## 1. Tổng quan

- **Tên dự án**: Glean Family Tree V2
- **Phiên bản**: 0.2.0 (Phase 4 Completed)
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
│   ├── share/                  # [NEW] Trang public view
│   │   └── [token]/            # Dynamic route cho shared links
│   ├── layout.tsx              # Root Layout (Providers: Query, UI Store)
│   └── page.tsx                # Landing Page
├── components/                 # React Components
│   ├── landing/                # Components cho Landing Page (Hero, Features...)
│   ├── ui/                     # Shadcn UI Components (Button, Input, Card...)
│   ├── FamilyTree.tsx          # Component hiển thị cây gia phả (ReactFlow)
│   ├── RelationshipModal.tsx   # Modal tạo/sửa mối quan hệ
│   ├── ShareDialog.tsx         # [NEW] Modal quản lý chia sẻ
│   ├── PhotoGallery.tsx        # [NEW] Quản lý thư viện ảnh
│   └── LifeEventTimeline.tsx   # [NEW] Dòng thời gian sự kiện cuộc đời
├── lib/                        # Logic & Utilities
│   ├── supabase/               # Supabase Integration
│   │   ├── client.ts           # Client-side Supabase client
│   │   ├── middleware.ts       # Middleware xử lý Auth & Session
│   │   ├── server.ts           # Server-side Supabase client
│   │   ├── admin.ts            # [NEW] Admin/Service Role operations
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
│   ├── supabase.ts             # Database Schema Types (Generated)
│   └── database.types.ts       # [NEW] Manual type definitions (SharedLink)
└── docs/                       # Tài liệu dự án
    ├── database/               # Database Scripts (SETUP_SUPABASE.sql)
    ├── deployment/             # Deployment Guides
    ├── system/                 # System Architecture
    ├── ARCHITECTURE.md         # Architecture Overview
    ├── STATE_MANAGEMENT_GUIDE.md # State Management Guide
    └── ...                     # Other Guides
```

## 3. Trạng thái Triển khai Chi tiết

### 3.1. Authentication & Security
| Tính năng | Trạng thái | Chi tiết |
|-----------|------------|----------|
| **Supabase Auth** | ✅ Hoàn thành | Tích hợp Email/Password login. |
| **Middleware** | ✅ Hoàn thành | Bảo vệ route `/dashboard`, refresh session token. |
| **RLS Policies** | ✅ Hoàn thành | Policies cho bảng `persons`, `relationships` và `shared_links`. |
| **Environment** | ✅ Hoàn thành | Đã config `.env.local` hỗ trợ chuyển đổi nhanh giữa Staging/Prod. |

### 3.2. Core Features (Dashboard)
| Thành phần | File | Trạng thái | Ghi chú |
|------------|------|------------|---------|
| **Dashboard Layout** | `app/dashboard/page.tsx` | ✅ Hoàn thành | Server Component, fetch data ban đầu (prefetch). |
| **Dashboard Logic** | `app/dashboard/DashboardClient.tsx` | ✅ Hoàn thành | Client Component, quản lý state, realtime subscription, CRUD operations. |
| **Quản lý Persons** | `lib/supabase/queries.ts` | ✅ Hoàn thành | CRUD đầy đủ. Mới thêm `is_deceased`, `date_of_death`. |
| **Quản lý Relationships** | `components/RelationshipModal.tsx` | ⚠️ Cơ bản | Đã có chức năng tạo Parent-Child. UI đang dùng native select, chưa tối ưu UX. |
| **Export/Share** | `components/ShareDialog.tsx` | ✅ Hoàn thành | Tạo link public read-only, Export PNG/SVG/PDF. |
| **Life Events** | `components/LifeEventTimeline.tsx` | ✅ Hoàn thành | Timeline sự kiện, hỗ trợ Stories/Traditions và gắn ảnh. |
| **Photo Gallery** | `components/PhotoGallery.tsx` | ✅ Hoàn thành | Upload ảnh, nhóm theo sự kiện (Phase 4). |

### 3.3. Visualization (Family Tree)
| Tính năng | Công nghệ | Trạng thái | Ghi chú |
|-----------|-----------|------------|---------|
| **Hiển thị Cây** | ReactFlow | ✅ Hoàn thành | Render nodes (Person) và edges (Relationship). |
| **Auto Layout** | Dagre | ✅ Hoàn thành | Tự động sắp xếp vị trí node theo phân cấp. |
| **Interactivity** | ReactFlow | ⚠️ Cơ bản | Zoom, Pan hoạt động. Chưa có click node để xem chi tiết/edit. |
| **Export Image** | html-to-image | ✅ Hoàn thành | Xuất cây ra file ảnh PNG/SVG. |
| **Print View** | CSS Print | ✅ Hoàn thành | In ra PDF với Family Chart trực quan. |

### 3.4. State Management
| Loại State | Thư viện | Pattern | Trạng thái |
|------------|----------|---------|------------|
| **Server State** | React Query | Custom Hooks | ✅ Ổn định. Tách biệt logic fetch data khỏi UI. |
| **UI State** | Zustand | Factory + Context | ✅ Ổn định. Tránh lỗi SSR hydration mismatch. |
| **URL State** | nuqs | Adapters + Hooks | ✅ Ổn định. Quản lý search params type-safe. |

### 3.5. Database Schema
- **Tables**: 
  - `persons`: Lưu thông tin thành viên (Thêm: `is_deceased`, `date_of_death`).
  - `relationships`: Lưu quan hệ cha-con.
  - `shared_links`: [NEW] Lưu token và cấu hình chia sẻ công khai.
- **Migrations**: 
  - Script `docs/database/SETUP_SUPABASE.sql` (Gốc).
  - `PHASE_4_SCHEMA_UPDATE.sql` (Person updates).
  - `PHASE_4_SHARE_LINKS.sql` (Shared links table & policies).
  - `PHASE_4_RPC.sql` (Secure public data fetching).
- **Realtime**: Đã bật cho các bảng chính.

### 3.6. Sharing & Public Access (New Phase 4)
- **Cơ chế**: Tạo `token` ngẫu nhiên lưu trong bảng `shared_links`.
- **Public URL**: `/share/[token]` truy cập không cần login.
- **Security**: 
  - Sử dụng RPC function `get_shared_tree_data` với `SECURITY DEFINER` để fetch dữ liệu an toàn mà không cần expose RLS public cho bảng chính.
  - Token có thể active/deactive hoặc hết hạn.

## 4. Các Vấn đề & Công việc Tồn đọng (Issues & Backlog)

### 4.1. Cleanup & Refactor
- [ ] **Delete Legacy Code**: Xóa thư mục `store/` và file `use-tree-store.ts` (đang dùng `stores/ui-store.ts`).
- [ ] **Consistency**: Chuẩn hóa dùng Shadcn UI components (Select, Dialog) thay vì native HTML elements trong `RelationshipModal`.

### 4.2. Features cần cải thiện
- [ ] **Relationship Types**: Hiện tại mới chỉ tập trung vào quan hệ cha-con (parent-child). Cần mở rộng cho vợ-chồng (spouse).
- [ ] **Node Editing**: Cho phép click vào node trên cây để sửa thông tin hoặc thêm quan hệ nhanh.
- [ ] **Validation**: Kiểm tra vòng lặp quan hệ (người A là cha người B, người B là cha người A).
- [ ] **Invite Collaborators**: Mời người khác cùng chỉnh sửa cây qua email (Phase 4.3).

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
- `html-to-image`: ^1.11.11 (New)
- `sonner`: ^1.7.1 (New)

### Environment Variables
Các biến cần thiết trong `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(Hiện tại file này đang chứa comment cho cả 2 môi trường để dễ switch).
