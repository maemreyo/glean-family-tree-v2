# Quy trình Release và Deployment

Tài liệu này mô tả quy trình phát triển, release và deployment cho dự án Glean Family Tree, sử dụng mô hình 3-tier (Feature -> Staging -> Production).

## 1. Kiến trúc Deployment

Chúng ta sử dụng 3 môi trường riêng biệt để đảm bảo chất lượng và an toàn dữ liệu:

| Môi trường | Nhánh Git | URL (Vercel) | Supabase Project | Mục đích |
|------------|-----------|--------------|------------------|----------|
| **Preview** | `feature/*` | `git-branch-url.vercel.app` | *Staging* (chung) | Dev test, PR review |
| **Staging** | `staging` | `staging.gleanfamily.com` | `glean-family-tree-staging` | UAT, Integration test |
| **Production** | `main` | `gleanfamily.com` | `glean-family-tree-prod` | Live user traffic |

> **Lưu ý:** Hiện tại chưa có domain thật, các URL trên là ví dụ. Vercel sẽ auto-generate domain dạng `project-name-git-branch.vercel.app`.

## 2. Quy trình phát triển (Git Flow)

### Bước 1: Phát triển tính năng (Feature Development)
1.  Từ nhánh `staging`, tạo nhánh feature mới:
    ```bash
    git checkout staging
    git pull
    git checkout -b feature/ten-tinh-nang
    ```
2.  Code và commit thay đổi.
3.  Push lên GitHub và tạo Pull Request (PR) vào nhánh `staging`.
4.  **CI Check:** GitHub Actions sẽ tự động chạy lint và type-check.
5.  **Preview Deployment:** Vercel sẽ tự động deploy một bản preview cho PR này.
6.  Review code và merge vào `staging`.

### Bước 2: Testing trên Staging (UAT)
1.  Sau khi merge vào `staging`, Vercel sẽ tự động deploy phiên bản mới nhất lên môi trường Staging.
2.  QA/Team test kỹ trên môi trường này.
3.  Đảm bảo mọi thứ hoạt động đúng với database Staging.

### Bước 3: Release ra Production
1.  Khi Staging đã ổn định, tạo PR từ `staging` vào `main`.
2.  Merge PR.
3.  Vercel sẽ tự động deploy lên môi trường Production.
4.  Tạo Git Tag cho version mới (nếu cần):
    ```bash
    git tag -a v1.0.0 -m "Release v1.0.0"
    git push origin v1.0.0
    ```

## 3. Cấu hình Môi trường (Environment Variables)

Mỗi môi trường cần file biến môi trường riêng. Trên Vercel, vào **Settings > Environment Variables** để cấu hình.

### Các biến cần thiết:

```env
# URL của Supabase Project (Khác nhau giữa Prod và Staging)
NEXT_PUBLIC_SUPABASE_URL=...

# Anon Key của Supabase Project (Khác nhau giữa Prod và Staging)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# URL của website (để config redirect sau login)
NEXT_PUBLIC_SITE_URL=...
```

### Cấu hình Supabase

Cần tạo 2 project Supabase riêng biệt:
1.  **Staging Project:** Dùng cho dev và staging.
2.  **Production Project:** Chỉ dùng cho production.

**Đồng bộ Database:**
Khi có thay đổi cấu trúc DB (migration), cần chạy script SQL trên cả 2 project.
File SQL chuẩn nằm tại: `docs/setup/supabase-nextjs-setup/SETUP_SUPABASE.sql`

## 4. Checklist trước khi Release

- [ ] Đã chạy lint và type-check thành công (`npm run lint`, `npm run type-check`).
- [ ] Đã update version trong `package.json` (nếu cần).
- [ ] Đã đồng bộ cấu trúc database giữa Staging và Production.
- [ ] Đã kiểm tra các biến môi trường trên Vercel Production.

## 5. Rollback

Nếu có lỗi nghiêm trọng trên Production:
1.  Vào Vercel Dashboard > Deployments.
2.  Chọn deployment ổn định trước đó.
3.  Bấm **"Redeploy"** hoặc **"Promote to Production"** (Instant Rollback).
4.  Sau đó fix lỗi trên dev/staging và release lại theo quy trình chuẩn.
