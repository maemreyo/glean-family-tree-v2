# 🚀 Supabase + Next.js 15 Boilerplate (2025)

Boilerplate CHUẨN cho Supabase với Next.js App Router, đã fix các vấn đề phổ biến về cookie, hydration, và authentication.

## ✅ Features

- ✨ Next.js 15 với App Router
- 🔐 Supabase Authentication (Email/Password, Magic Link)
- 🍪 Cookie-based sessions (correct implementation)
- 🔄 Realtime subscriptions
- 🛡️ Row Level Security (RLS) patterns
- 📝 TypeScript với type-safe Supabase queries
- 🎨 Tailwind CSS
- 🐛 Zero hydration errors
- 🚫 Zero cookie issues

## 📁 Folder Structure

```
project/
├── app/
│   ├── dashboard/
│   │   └── page.tsx              # Protected Server Component
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # Auth callback handler
│   ├── api/
│   │   └── persons/
│   │       └── route.ts          # API Route Handler
│   └── actions/
│       └── person-actions.ts     # Server Actions
├── components/
│   ├── FamilyTreeClient.tsx      # Client Component với Realtime
│   └── LoginForm.tsx             # Login form
├── lib/
│   └── supabase/
│       ├── client.ts             # Browser client
│       └── server.ts             # Server client
├── types/
│   └── database.types.ts         # Supabase database types
├── middleware.ts                 # Auth middleware (BẮT BUỘC)
└── .env.local                    # Environment variables
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

### 2. Configure Environment Variables

Tạo file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Lấy credentials từ: [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api)

### 3. Setup Supabase Database

Tạo table `persons`:

```sql
-- Create table
create table persons (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  date_of_birth date,
  gender text,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Enable Row Level Security
alter table persons enable row level security;

-- Create policies
create policy "Users can view own persons"
  on persons for select
  using (auth.uid() = user_id);

create policy "Users can insert own persons"
  on persons for insert
  with check (auth.uid() = user_id);

create policy "Users can update own persons"
  on persons for update
  using (auth.uid() = user_id);

create policy "Users can delete own persons"
  on persons for delete
  using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table persons;
```

### 4. Configure Supabase Auth

Trong Supabase Dashboard → Authentication → URL Configuration:

**Redirect URLs** - Thêm:
```
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

### 5. Run Development Server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## 📚 Usage Patterns

### Server Component (Fetch Data)

```tsx
// app/page.tsx
import { createServerSupabase } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('persons').select('*')
  
  return <div>{/* render data */}</div>
}
```

### Client Component (Realtime)

```tsx
// components/MyComponent.tsx
'use client'
import { createClientSupabase } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createClientSupabase()
  // Use supabase for mutations, subscriptions
}
```

### Route Handler (API)

```tsx
// app/api/data/route.ts
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('persons').select('*')
  return Response.json(data)
}
```

### Server Action (Forms)

```tsx
// app/actions.ts
'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function createPerson(formData: FormData) {
  const supabase = await createServerSupabase()
  // Handle form submission
}
```

## ⚠️ Common Issues & Solutions

### Issue: Session mất sau refresh
**Nguyên nhân:** Không có middleware để refresh session  
**Giải pháp:** Đảm bảo `middleware.ts` đã được setup đúng

### Issue: Hydration error
**Nguyên nhân:** Server và client auth state khác nhau  
**Giải pháp:** Dùng `initialData` pattern - fetch ở server, pass xuống client

### Issue: 401 Unauthorized
**Nguyên nhân:** Cookie không được gửi đúng cách  
**Giải pháp:** Dùng `createServerSupabase()` trong server components

### Issue: Realtime không hoạt động
**Nguyên nhân:** Dùng sai client type  
**Giải pháp:** Dùng `createClientSupabase()` trong client components

### Issue: TypeScript errors
**Nguyên nhân:** Missing database types  
**Giải pháp:** Generate types từ Supabase:

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

## 🎯 Best Practices

### ✅ DO:
- Dùng `@supabase/ssr` package (KHÔNG dùng trực tiếp `@supabase/supabase-js`)
- Luôn await `createServerSupabase()` trong server code
- Setup middleware để refresh sessions
- Dùng RLS (Row Level Security) cho data security
- Pass `initialData` từ server → client để tránh loading states
- Validate authentication trong mỗi API route
- Cleanup realtime subscriptions trong useEffect

### ❌ DON'T:
- Dùng `createClientSupabase()` trong Server Components
- Dùng `createServerSupabase()` trong Client Components
- Quên setup middleware
- Bỏ qua RLS policies
- Share service role key trong client code

## 📖 Additional Resources

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Auth Helpers Migration Guide](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers)

## 🤝 Contributing

Issues và PRs welcome!

## 📝 License

MIT

---

**Được tạo bởi Claude (2025)** - Boilerplate CHUẨN để tránh các vấn đề phổ biến với Supabase + Next.js! 🚀
