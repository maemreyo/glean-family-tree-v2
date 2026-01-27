# ⚡ Quick Start Guide

Get up and running trong 5 phút!

## 🚀 Installation

```bash
# 1. Clone or copy boilerplate files
npm install

# 2. Setup environment
cp .env.local.example .env.local
# Edit .env.local với Supabase credentials
```

## 🔧 Required Setup

### 1. Supabase Database

```sql
-- Run trong Supabase SQL Editor
create table persons (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  user_id uuid references auth.users(id) not null
);

alter table persons enable row level security;

create policy "Users can view own persons"
  on persons for select using (auth.uid() = user_id);

alter publication supabase_realtime add table persons;
```

### 2. Supabase Auth

Dashboard → Authentication → Providers:
- ✅ Enable Email provider

### 3. Start Development

```bash
npm run dev
```

Open http://localhost:3000

## 📝 Your First Feature

### 1. Add a new query

```tsx
// lib/supabase/queries.ts
export function useMyData(userId: string) {
  return useQuery({
    queryKey: ['my-data', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('my_table')
        .select('*')
        .eq('user_id', userId)
      
      if (error) throw error
      return data
    },
  })
}
```

### 2. Add UI state

```tsx
// stores/ui-store.ts
export const createUIStore = () => {
  return createStore<UIStore>((set) => ({
    // ... existing state
    
    myNewState: false,
    setMyNewState: (value) => set({ myNewState: value }),
  }))
}
```

### 3. Use in component

```tsx
'use client'

function MyComponent({ userId }: { userId: string }) {
  // React Query - Server data
  const { data, isLoading } = useMyData(userId)
  
  // Zustand - UI state
  const myState = useUIStore((state) => state.myNewState)
  const setMyState = useUIStore((state) => state.setMyNewState)
  
  return (
    <div>
      {isLoading ? 'Loading...' : data.map(...)}
      <button onClick={() => setMyState(!myState)}>
        Toggle: {myState ? 'On' : 'Off'}
      </button>
    </div>
  )
}
```

## 🎯 Common Tasks

### Add a table

1. Create table trong Supabase
2. Enable RLS
3. Add to realtime: `alter publication supabase_realtime add table my_table`
4. Generate types: `npx supabase gen types typescript > types/database.types.ts`
5. Create queries trong `lib/supabase/queries.ts`

### Add authentication

```tsx
// app/login/page.tsx
const supabase = createClientSupabase()

const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
}
```

### Add realtime

```tsx
// lib/supabase/realtime.ts - Add new hook
export function useRealtimeMyTable(userId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const channel = supabase
      .channel(`my-table-${userId}`)
      .on('postgres_changes', { ... }, (payload) => {
        queryClient.invalidateQueries(['my-table', userId])
      })
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [userId, queryClient])
}
```

## 📚 File Locations

| What | Where |
|------|-------|
| Supabase clients | `lib/supabase/client.ts`, `server.ts` |
| React Query hooks | `lib/supabase/queries.ts` |
| Realtime hooks | `lib/supabase/realtime.ts` |
| UI state | `stores/ui-store.ts` |
| Providers | `providers/` |
| Types | `types/database.types.ts` |

## 🆘 Troubleshooting

### "useUIStore must be used within UIStoreProvider"

Check `app/layout.tsx` has `<Providers>` wrapper.

### React Query not working

Check `<ReactQueryProvider>` trong `providers/index.tsx`.

### Realtime not working

1. Check `alter publication supabase_realtime add table ...`
2. Check browser console có "SUBSCRIBED"
3. Check RLS policies

### TypeScript errors

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

## 🎓 Next Steps

1. ✅ Read [README.md](./README.md) - Full documentation
2. ✅ Read [STATE_MANAGEMENT_GUIDE.md](./STATE_MANAGEMENT_GUIDE.md) - When to use what
3. ✅ Check example components trong `app/dashboard/`
4. ✅ Add authentication flow
5. ✅ Deploy to Vercel

---

**You're ready to build! 🚀**

Nếu stuck, check [README.md](./README.md) hoặc các guide files khác.
