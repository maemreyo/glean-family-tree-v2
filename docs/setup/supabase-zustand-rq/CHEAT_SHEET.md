# 📝 Cheat Sheet: React Query + Zustand

Quick reference cho tất cả patterns quan trọng.

## 🔍 Quick Decision

```
Server data (DB/API)     → React Query
Global UI state          → Zustand
Local component state    → useState
URL state (filters)      → nuqs
```

## 📖 React Query Patterns

### Query (Read)

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['persons', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return data
  },
})
```

### Mutation (Write)

```tsx
const createPerson = useMutation({
  mutationFn: async (person) => {
    const { data, error } = await supabase
      .from('persons')
      .insert(person)
      .select()
      .single()
    if (error) throw error
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['persons'] })
  },
})

// Usage
await createPerson.mutateAsync({ name: 'John' })
```

### With InitialData (Server → Client)

```tsx
// Server Component
const { data } = await supabase.from('persons').select('*')
return <ClientComponent initialData={data} />

// Client Component
const { data = initialData } = usePersons(userId, { initialData })
```

### Optimistic Update

```tsx
const updatePerson = useMutation({
  mutationFn: async ({ id, updates }) => {
    const { data, error } = await supabase
      .from('persons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  onMutate: async ({ id, updates }) => {
    await queryClient.cancelQueries(['persons', id])
    const previous = queryClient.getQueryData(['persons', id])
    
    queryClient.setQueryData(['persons', id], (old) => ({
      ...old,
      ...updates,
    }))
    
    return { previous }
  },
  onError: (err, { id }, context) => {
    queryClient.setQueryData(['persons', id], context.previous)
  },
})
```

## 🔗 Nuqs Patterns (URL State)

### Basic Usage

```tsx
import { useQueryState, parseAsString } from 'nuqs'

// Simple string
const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))

// With options
const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('tree').withOptions({
  history: 'push', // or 'replace'
  shallow: true, // Client-side only update
}))
```

### Custom Hook Pattern

```tsx
// lib/hooks/use-dashboard-params.ts
export function useDashboardParams() {
  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''))
  return { q, setQ }
}
```

## 🎨 Zustand Patterns

### Store Definition

```tsx
// stores/ui-store.ts
import { createStore } from 'zustand/vanilla'

export type UIStore = {
  count: number
  increment: () => void
}

export const createUIStore = () => {
  return createStore<UIStore>((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
}
```

### Provider Setup

```tsx
// providers/ui-store-provider.tsx
'use client'
import { createContext, useRef, useContext } from 'react'
import { useStore } from 'zustand'

const UIStoreContext = createContext(null)

export function UIStoreProvider({ children }) {
  const storeRef = useRef()
  if (!storeRef.current) {
    storeRef.current = createUIStore()
  }
  return (
    <UIStoreContext.Provider value={storeRef.current}>
      {children}
    </UIStoreContext.Provider>
  )
}

export function useUIStore(selector) {
  const store = useContext(UIStoreContext)
  if (!store) throw new Error('Missing UIStoreProvider')
  return useStore(store, selector)
}
```

### Usage in Component

```tsx
// ✅ GOOD - With selector
const count = useUIStore((state) => state.count)
const increment = useUIStore((state) => state.increment)

// ❌ BAD - Without selector (re-renders on ANY change)
const { count, increment } = useUIStore()
```

### Complex Selector

```tsx
const filteredItems = useUIStore((state) => 
  state.items.filter((item) => item.category === state.selectedCategory)
)
```

## 🔄 Realtime Pattern

```tsx
export function useRealtimePersons(userId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const channel = supabase
      .channel(`persons-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'persons',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(['persons', userId], (old) =>
              [payload.new, ...old]
            )
          }
          // Handle UPDATE, DELETE...
        }
      )
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [userId, queryClient])
}
```

## 🏗️ Component Patterns

### Server Component

```tsx
// app/page.tsx
export default async function Page() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('persons').select('*')
  
  return <ClientComponent initialData={data} />
}
```

### Client Component (Full Example)

```tsx
// components/MyComponent.tsx
'use client'

export function MyComponent({ userId, initialData }) {
  // React Query - Server data
  const { data: persons, isLoading } = usePersons(userId, { initialData })
  const createPerson = useCreatePerson()
  
  // Zustand - UI state
  const selectedId = useUIStore((state) => state.selectedPersonId)
  const setSelectedId = useUIStore((state) => state.setSelectedPersonId)
  
  // Local state
  const [name, setName] = useState('')
  
  // Realtime
  useRealtimePersons(userId)
  
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => createPerson.mutate({ name, user_id: userId })}>
        Add
      </button>
      
      {persons?.map((person) => (
        <div key={person.id} onClick={() => setSelectedId(person.id)}>
          {person.name}
        </div>
      ))}
    </div>
  )
}
```

## 🔑 Query Keys Pattern

```tsx
// Centralized query keys
export const queryKeys = {
  persons: {
    all: ['persons'],
    byUser: (userId: string) => ['persons', 'user', userId],
    detail: (id: string) => ['persons', 'detail', id],
  },
}

// Usage
queryClient.invalidateQueries({ queryKey: queryKeys.persons.all })
```

## 🎯 Common Operations

### Invalidate Query

```tsx
queryClient.invalidateQueries({ queryKey: ['persons'] })
```

### Set Query Data

```tsx
queryClient.setQueryData(['persons', userId], newData)
```

### Remove Query

```tsx
queryClient.removeQueries({ queryKey: ['persons', personId] })
```

### Prefetch

```tsx
await queryClient.prefetchQuery({
  queryKey: ['persons', userId],
  queryFn: () => fetchPersons(userId),
})
```

## ⚙️ React Query Config

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // Fresh for 1 min
      gcTime: 5 * 60 * 1000,       // Cache for 5 min
      refetchOnWindowFocus: false,  // Don't refetch on focus
      retry: 1,                     // Retry once
    },
  },
})
```

## 📦 Provider Setup

```tsx
// app/layout.tsx
import { Providers } from '@/providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

// providers/index.tsx
export function Providers({ children }) {
  return (
    <ReactQueryProvider>
      <UIStoreProvider>
        {children}
      </UIStoreProvider>
    </ReactQueryProvider>
  )
}
```

## 🚫 Anti-Patterns

```tsx
// ❌ BAD: Server data trong Zustand
const persons = useStore((state) => state.persons)

// ✅ GOOD: Server data trong React Query
const { data: persons } = usePersons(userId)

// ❌ BAD: No selector
const { sidebarOpen } = useUIStore()

// ✅ GOOD: With selector
const sidebarOpen = useUIStore((state) => state.sidebarOpen)

// ❌ BAD: Manual useEffect fetching
useEffect(() => { fetchData() }, [])

// ✅ GOOD: React Query
const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData })
```

## 🔧 TypeScript

```tsx
// Type-safe Supabase client
import type { Database } from '@/types/database.types'

const supabase = createClientSupabase<Database>()

// Type-safe query
const { data } = await supabase
  .from('persons') // TypeScript knows this table
  .select('*')      // TypeScript knows these columns
```

---

**Print this and keep on desk! 📌**
