# 🐛 Troubleshooting Guide

## Common Errors và Solutions

### 1. ❌ `createMiddlewareClient is not a function`

**Error:**
```
TypeError: createMiddlewareClient is not a function
```

**Nguyên nhân:**
Function `createMiddlewareClient` KHÔNG TỒN TẠI trong `@supabase/ssr`. Document cũ hoặc tutorial sai.

**Giải pháp:**
Dùng `createServerClient` với custom cookie handlers:

```ts
// middleware.ts - ĐÚNG
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  
  await supabase.auth.getUser()
  return supabaseResponse
}
```

---

### 2. ❌ `cookies() expects to be awaited`

**Error:**
```
Error: cookies() expects to be awaited
```

**Nguyên nhân:**
Next.js 15+ làm `cookies()` trở thành async function.

**Giải pháp:**
Thêm `await` khi gọi `cookies()`:

```ts
// lib/supabase/server.ts - ĐÚNG
export async function createServerSupabase() {
  const cookieStore = await cookies() // ← ADD await
  // ...
}
```

---

### 3. ❌ Session mất sau refresh page

**Triệu chứng:**
- User login thành công
- Refresh page → bị logout
- Cookie không persist

**Nguyên nhân:**
Middleware không được setup hoặc không gọi `getUser()`.

**Giải pháp:**

1. Đảm bảo có file `middleware.ts` ở root
2. PHẢI gọi `supabase.auth.getUser()` trong middleware:

```ts
// middleware.ts
export async function middleware(request: NextRequest) {
  // ... setup supabase client
  
  // QUAN TRỌNG: Phải gọi getUser() để refresh session
  await supabase.auth.getUser()
  
  return supabaseResponse
}
```

3. Check matcher config:

```ts
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### 4. ❌ Hydration mismatch error

**Error:**
```
Error: Hydration failed because the initial UI does not match what was rendered on the server
```

**Nguyên nhân:**
Server Component thấy user logged in, Client Component thấy không logged in → UI khác nhau.

**Giải pháp:**
Dùng **initialData pattern**:

```tsx
// app/page.tsx - Server Component
export default async function Page() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch data ở server
  const { data } = await supabase.from('persons').select('*')
  
  // Pass initialData xuống Client Component
  return <ClientComponent initialData={data} user={user} />
}
```

```tsx
// components/ClientComponent.tsx
'use client'
export function ClientComponent({ initialData, user }) {
  const [data, setData] = useState(initialData) // Use initial data from server
  // ...
}
```

---

### 5. ❌ 401 Unauthorized trong API Route

**Error:**
```
GET /api/persons 401 Unauthorized
```

**Nguyên nhân:**
Cookie không được gửi đúng cách từ client → server.

**Giải pháp:**

1. Đảm bảo dùng `createServerSupabase()` trong Route Handler:

```ts
// app/api/persons/route.ts
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase() // ĐÚNG
  // ...
}
```

2. KHÔNG dùng `createClientSupabase()` trong Route Handler

---

### 6. ❌ Realtime subscription không hoạt động

**Triệu chứng:**
- Không nhận được realtime updates
- Console không show "SUBSCRIBED"

**Giải pháp:**

1. Enable Realtime trong Supabase:

```sql
alter publication supabase_realtime add table persons;
```

2. Dùng `createClientSupabase()` trong Client Component:

```tsx
'use client'
import { createClientSupabase } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createClientSupabase() // ĐÚNG - Client Component
  
  useEffect(() => {
    const channel = supabase
      .channel('my-channel')
      .on('postgres_changes', { ... }, (payload) => {
        console.log('Change received!', payload)
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
```

3. KHÔNG dùng `createServerSupabase()` cho realtime (chỉ work trong browser)

---

### 7. ❌ OAuth redirect không hoạt động

**Triệu chứng:**
- Click "Login with Google" → không redirect về
- Stuck ở auth provider page

**Giải pháp:**

1. Setup callback route:

```ts
// app/auth/callback/route.ts
import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabase()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
```

2. Configure Redirect URL trong Supabase Dashboard:

```
Authentication → URL Configuration → Redirect URLs
Add: http://localhost:3000/auth/callback
```

---

### 8. ❌ TypeScript errors với Supabase queries

**Error:**
```
Property 'name' does not exist on type 'never'
```

**Giải pháp:**

1. Generate types từ database:

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

2. Type Supabase client:

```ts
import type { Database } from '@/types/database.types'

const supabase = createClientSupabase<Database>()
```

---

### 9. ❌ RLS Policy blocking queries

**Error:**
```
new row violates row-level security policy
```

**Giải pháp:**

Check RLS policies:

```sql
-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'persons';

-- Example correct policies
create policy "Users can view own persons"
  on persons for select
  using (auth.uid() = user_id);

create policy "Users can insert own persons"
  on persons for insert
  with check (auth.uid() = user_id);
```

Đảm bảo:
- `user_id` column tồn tại
- `user_id` được set đúng khi insert
- Policy logic đúng

---

### 10. ❌ Environment variables không load

**Triệu chứng:**
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**Giải pháp:**

1. Check file name: `.env.local` (KHÔNG phải `.env`)

2. Restart dev server sau khi thay đổi env:

```bash
npm run dev
```

3. Đảm bảo có prefix `NEXT_PUBLIC_` cho client-side variables:

```env
# ✅ ĐÚNG - accessible ở cả client và server
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# ❌ SAI - chỉ accessible ở server
SUPABASE_URL=...
```

---

## 🔍 Debug Checklist

Khi gặp issue, check theo thứ tự:

- [ ] Middleware có được setup và gọi `getUser()`?
- [ ] Có dùng đúng client type? (server vs client)
- [ ] Có await `cookies()` trong Next.js 15+?
- [ ] Environment variables có load đúng?
- [ ] RLS policies có đúng?
- [ ] Realtime có được enable trong Supabase?
- [ ] Redirect URL có được config trong Supabase Dashboard?
- [ ] Package versions có đúng?

---

## 📦 Recommended Package Versions

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "@supabase/ssr": "^0.7.1",
    "@supabase/supabase-js": "^2.49.3"
  }
}
```

---

## 🆘 Still Having Issues?

1. Check [Supabase Discord](https://discord.supabase.com/)
2. Check [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Check browser console và server logs
4. Enable Supabase debug logging:

```ts
const supabase = createClientSupabase({
  auth: {
    debug: true
  }
})
```
