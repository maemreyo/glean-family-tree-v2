# 📝 Migration Checklist

Hướng dẫn migrate từ setup cũ sang boilerplate mới này.

## 🔄 Từ `@supabase/auth-helpers-nextjs` → `@supabase/ssr`

### 1. Update Dependencies

```bash
# Gỡ packages cũ
npm uninstall @supabase/auth-helpers-nextjs

# Cài packages mới
npm install @supabase/ssr@latest @supabase/supabase-js@latest
```

### 2. Replace Client Creation

**CŨ (❌):**
```ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
const supabase = createClientComponentClient()
```

**MỚI (✅):**
```ts
import { createClientSupabase } from '@/lib/supabase/client'
const supabase = createClientSupabase()
```

### 3. Replace Server Client

**CŨ (❌):**
```ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createServerComponentClient({ cookies })
```

**MỚI (✅):**
```ts
import { createServerSupabase } from '@/lib/supabase/server'

const supabase = await createServerSupabase()
```

### 4. Replace Middleware

**CŨ (❌):**
```ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  return res
}
```

**MỚI (✅):**
```ts
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

## 🔄 Từ Pages Router → App Router

### 1. Folder Structure

**CŨ:**
```
pages/
├── _app.tsx
├── api/
├── index.tsx
└── dashboard.tsx
```

**MỚI:**
```
app/
├── page.tsx
├── dashboard/
│   └── page.tsx
└── api/
    └── route.ts
```

### 2. Data Fetching

**CŨ - getServerSideProps:**
```tsx
export async function getServerSideProps(context) {
  const supabase = createServerSupabaseClient(context)
  const { data } = await supabase.from('persons').select('*')
  return { props: { data } }
}
```

**MỚI - Server Component:**
```tsx
export default async function Page() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('persons').select('*')
  return <div>{/* render */}</div>
}
```

### 3. API Routes

**CŨ - pages/api/persons.ts:**
```ts
export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res })
  // ...
}
```

**MỚI - app/api/persons/route.ts:**
```ts
export async function GET(request: Request) {
  const supabase = await createServerSupabase()
  // ...
  return Response.json(data)
}
```

---

## ✅ Step-by-Step Migration

### Phase 1: Setup New Files (Không phá code cũ)

- [ ] Copy `lib/supabase/client.ts` từ boilerplate
- [ ] Copy `lib/supabase/server.ts` từ boilerplate
- [ ] Copy `middleware.ts` từ boilerplate
- [ ] Update `package.json` dependencies
- [ ] Run `npm install`

### Phase 2: Migrate Components

- [ ] Replace imports trong Client Components:
  ```diff
  - import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
  + import { createClientSupabase } from '@/lib/supabase/client'
  ```

- [ ] Replace imports trong Server Components:
  ```diff
  - import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
  + import { createServerSupabase } from '@/lib/supabase/server'
  
  - const supabase = createServerComponentClient({ cookies })
  + const supabase = await createServerSupabase()
  ```

- [ ] Update all auth checks:
  ```diff
  - const { data: { session } } = await supabase.auth.getSession()
  + const { data: { user } } = await supabase.auth.getUser()
  ```

### Phase 3: Migrate API Routes & Server Actions

- [ ] Migrate Pages Router API routes → App Router Route Handlers
- [ ] Replace Supabase client trong API routes
- [ ] Test authentication flow

### Phase 4: Testing

- [ ] Test login/signup flow
- [ ] Test protected routes
- [ ] Test API endpoints
- [ ] Test realtime subscriptions
- [ ] Test session persistence after refresh

### Phase 5: Cleanup

- [ ] Remove old Supabase helper files
- [ ] Uninstall `@supabase/auth-helpers-nextjs`
- [ ] Update documentation
- [ ] Remove unused imports

---

## 🚨 Breaking Changes Alert

### 1. `getSession()` → `getUser()`

**Tại sao?**
`getSession()` không verify token với Supabase server, có thể bị fake.

**Migration:**
```diff
- const { data: { session } } = await supabase.auth.getSession()
- if (session) { ... }
+ const { data: { user } } = await supabase.auth.getUser()
+ if (user) { ... }
```

### 2. Cookies must be awaited (Next.js 15+)

```diff
- const cookieStore = cookies()
+ const cookieStore = await cookies()
```

### 3. Middleware response handling changed

Phải return response từ NextResponse.next() VỚI updated cookies, không return response trống.

---

## 📊 Checklist Before Going Live

### Security
- [ ] RLS policies enabled trên TẤT CẢ tables
- [ ] Service role key KHÔNG exposed ở client
- [ ] Auth redirect URLs configured đúng
- [ ] CORS settings reviewed

### Performance
- [ ] Middleware chỉ run trên necessary routes
- [ ] Database indexes setup đúng
- [ ] Realtime subscriptions có cleanup
- [ ] Client-side caching implemented (React Query/SWR)

### User Experience
- [ ] Loading states implemented
- [ ] Error handling graceful
- [ ] Offline handling (if needed)
- [ ] Session expiry handling

### Testing
- [ ] Auth flow tested (login/logout/signup)
- [ ] Protected routes tested
- [ ] API endpoints tested
- [ ] Realtime tested
- [ ] Mobile responsive tested

---

## 🆘 Rollback Plan

Nếu migration fail, rollback nhanh:

1. Checkout git commit trước khi migrate:
```bash
git checkout <previous-commit>
```

2. Reinstall old dependencies:
```bash
npm install @supabase/auth-helpers-nextjs@latest
```

3. Notify team và schedule retry

---

## 📚 Reference Materials

- [Supabase SSR Migration Guide](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers)
- [Next.js App Router Migration](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Boilerplate README](./README.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Good luck với migration! 🚀**

Có vấn đề gì, refer lại Troubleshooting Guide hoặc tạo issue trên repo!
