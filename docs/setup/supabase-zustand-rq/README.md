# 🚀 Supabase + Zustand + React Query + Next.js 15

**Perfect state management boilerplate** với giải pháp cho mọi vấn đề phổ biến.

## ✨ Features

- ⚡ **Next.js 15** với App Router
- 🔐 **Supabase** authentication & database
- 🗂️ **React Query** - Server state management
- 🎨 **Zustand** - UI state management (with Provider pattern)
- 🔄 **Realtime subscriptions** tích hợp hoàn hảo
- 🎯 **Zero hydration errors**
- 🚫 **Zero prop drilling**
- ✅ **TypeScript** type-safe
- 🎨 **Tailwind CSS**

## 🎯 State Management Philosophy

| State Type | Solution | Why? |
|------------|----------|------|
| **Server Data** | React Query | Cache, refetch, optimistic updates |
| **UI State** | Zustand | Simple, no boilerplate |
| **Form State** | Local useState | Keep it simple |
| **URL State** | nuqs | Type-safe search params |

## 📁 Project Structure

```
project/
├── app/
│   ├── layout.tsx              # Root layout với Providers
│   ├── dashboard/
│   │   ├── page.tsx            # Server Component
│   │   └── DashboardClient.tsx # Client Component
│   └── login/
│       └── page.tsx
├── lib/
│   └── supabase/
│       ├── client.ts           # Browser client
│       ├── server.ts           # Server client
│       ├── queries.ts          # React Query hooks
│       └── realtime.ts         # Realtime subscriptions
├── stores/
│   └── ui-store.ts             # Zustand store (vanilla)
├── providers/
│   ├── index.tsx               # Combined providers
│   ├── react-query-provider.tsx
│   └── ui-store-provider.tsx   # Zustand Provider
├── types/
│   └── database.types.ts
└── middleware.ts
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

Run SQL trong Supabase:

```sql
create table persons (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now() not null,
  name text not null,
  date_of_birth date,
  user_id uuid references auth.users(id) not null
);

alter table persons enable row level security;

create policy "Users can view own persons"
  on persons for select
  using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table persons;
```

### 4. Run Development Server

```bash
npm run dev
```

## 📚 Usage Patterns

### React Query - Server Data

```tsx
// Fetch data
const { data: persons, isLoading } = usePersons(userId, {
  initialData: serverFetchedData, // From Server Component
})

// Mutation
const createPerson = useCreatePerson()
await createPerson.mutateAsync({
  name: 'John Doe',
  user_id: userId,
})
```

### Zustand - UI State

```tsx
// ✅ ĐÚNG - Với selector (optimized)
const sidebarOpen = useUIStore((state) => state.sidebarOpen)
const toggleSidebar = useUIStore((state) => state.toggleSidebar)

// ❌ SAI - Không dùng destructuring
const { sidebarOpen, toggleSidebar } = useUIStore()
```

### Realtime Subscriptions

```tsx
'use client'

export function MyComponent({ userId }: { userId: string }) {
  // Auto sync với React Query cache
  useRealtimePersons(userId)
  
  // React Query data sẽ auto update khi có changes
  const { data: persons } = usePersons(userId)
  
  return <div>{/* render */}</div>
}
```

### Server Component → Client Component Pattern

```tsx
// app/page.tsx (Server Component)
export default async function Page() {
  const supabase = await createServerSupabase()
  const { data: persons } = await supabase.from('persons').select('*')
  
  return <ClientComponent initialPersons={persons} />
}

// ClientComponent.tsx (Client Component)
'use client'
export function ClientComponent({ initialPersons }) {
  const { data: persons = initialPersons } = usePersons(userId, {
    initialData: initialPersons, // ← QUAN TRỌNG
  })
  
  return <div>{/* render */}</div>
}
```

## 🎯 Best Practices

### ✅ DO:

1. **React Query cho tất cả server data**
```tsx
// ✅ ĐÚNG
const { data } = usePersons(userId)
```

2. **Zustand cho UI state**
```tsx
// ✅ ĐÚNG
const modalOpen = useUIStore((state) => state.modalOpen)
```

3. **Pass initialData từ Server Components**
```tsx
// ✅ ĐÚNG
<ClientComponent initialData={serverData} />
```

4. **Dùng selector trong Zustand**
```tsx
// ✅ ĐÚNG - Chỉ re-render khi sidebarOpen thay đổi
const sidebarOpen = useUIStore((state) => state.sidebarOpen)
```

5. **Cleanup realtime subscriptions**
```tsx
// ✅ ĐÚNG - Auto cleanup trong useEffect
useRealtimePersons(userId)
```

### ❌ DON'T:

1. **KHÔNG dùng Zustand cho server data**
```tsx
// ❌ SAI
const persons = useUIStore((state) => state.persons) // Server data trong Zustand
```

2. **KHÔNG dùng global Zustand store**
```tsx
// ❌ SAI cho App Router
export const useStore = create(() => ({ ... }))
```

3. **KHÔNG destructure Zustand**
```tsx
// ❌ SAI - Re-render on ANY state change
const { sidebarOpen, modalOpen } = useUIStore()
```

4. **KHÔNG quên Provider**
```tsx
// ❌ SAI - Missing Providers
<html>
  <body>{children}</body> // Missing <Providers>
</html>
```

## 🔄 Data Flow Diagram

```
Server Component
    ↓ (prefetch data)
    ↓
Client Component
    ↓
React Query (server data)
    ↓
Zustand (UI state)
    ↓
Components
    ↑
Realtime Subscriptions → React Query Cache
```

## ⚠️ Common Pitfalls & Solutions

### Issue 1: Hydration Error

**Nguyên nhân:** Server Component và Client Component có auth state khác nhau.

**Giải pháp:** Pass `initialData` từ Server Component:

```tsx
// Server Component
const { data } = await supabase.from('persons').select('*')
return <ClientComponent initialData={data} />

// Client Component
const { data = initialData } = usePersons(userId, { initialData })
```

### Issue 2: Zustand State không persist across requests (SSR)

**Nguyên nhân:** Dùng global store thay vì Provider pattern.

**Giải pháp:** Dùng `createStore` + Provider (đã implement trong boilerplate).

### Issue 3: Too many re-renders với Zustand

**Nguyên nhân:** Không dùng selector.

**Giải pháp:**
```tsx
// ❌ SAI
const store = useUIStore()

// ✅ ĐÚNG
const value = useUIStore((state) => state.value)
```

### Issue 4: React Query không update sau mutation

**Nguyên nhân:** Quên invalidate queries.

**Giải pháp:** Đã handle trong `queries.ts`:
```tsx
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['persons'] })
}
```

### Issue 5: Realtime không hoạt động

**Checklist:**
- [ ] Enable Realtime trong Supabase Dashboard?
- [ ] Run `alter publication supabase_realtime add table persons`?
- [ ] Gọi `useRealtimePersons()` trong Client Component?
- [ ] Check browser console có log "SUBSCRIBED"?

## 📦 Dependencies Explained

| Package | Purpose | Why? |
|---------|---------|------|
| `@tanstack/react-query` | Server state | Cache, refetch, mutations |
| `zustand` | UI state | Simple, no Provider boilerplate* |
| `@supabase/ssr` | Supabase client | Cookie handling cho Next.js |

*Note: Chúng ta vẫn dùng Provider pattern cho Zustand trong App Router, nhưng syntax đơn giản hơn nhiều so với Context API.

## 🎓 Learning Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

## 🐛 Troubleshooting

### React Query DevTools không show

Check `NODE_ENV`:
```tsx
{process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
```

### Zustand store undefined

Check Provider hierarchy:
```tsx
// app/layout.tsx
<Providers> // ← Phải có
  {children}
</Providers>
```

### TypeScript errors với Supabase

Generate types:
```bash
npx supabase gen types typescript --project-id your-id > types/database.types.ts
```

## 🚀 Next Steps

1. [ ] Add authentication flow
2. [ ] Add more tables (relationships, etc.)
3. [ ] Add optimistic updates
4. [ ] Add error boundaries
5. [ ] Add loading skeletons
6. [ ] Add unit tests

## 📝 License

MIT

---

**Built with ❤️ using the best state management practices of 2025**
