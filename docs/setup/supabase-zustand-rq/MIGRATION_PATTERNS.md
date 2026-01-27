# 🔄 Migration Guide: Old Pattern → New Pattern

Guide để migrate từ anti-patterns sang best practices.

## 1. From Global Zustand Store → Provider Pattern

### ❌ Old (Problematic trong App Router)

```tsx
// store/ui-store.ts
import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
```

**Problems:**
- Store được share across server requests
- Hydration errors
- Memory leaks
- State pollution between users

### ✅ New (Provider Pattern)

```tsx
// stores/ui-store.ts
import { createStore } from 'zustand/vanilla'

export const createUIStore = () => {
  return createStore((set) => ({
    sidebarOpen: false,
    toggleSidebar: () => set((state) => ({ 
      sidebarOpen: !state.sidebarOpen 
    })),
  }))
}

// providers/ui-store-provider.tsx
'use client'
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

// app/layout.tsx
<UIStoreProvider>{children}</UIStoreProvider>
```

---

## 2. From Zustand for Server Data → React Query

### ❌ Old (Manual server state management)

```tsx
// store/data-store.ts
export const useDataStore = create((set) => ({
  persons: [],
  loading: false,
  error: null,
  
  fetchPersons: async (userId) => {
    set({ loading: true })
    try {
      const { data } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
      set({ persons: data, loading: false })
    } catch (error) {
      set({ error, loading: false })
    }
  },
}))

// Component
function Component() {
  const { persons, loading, fetchPersons } = useDataStore()
  
  useEffect(() => {
    fetchPersons(userId)
  }, [userId])
}
```

**Problems:**
- Manual loading/error handling
- No caching
- No refetch logic
- Stale data issues
- Duplicate requests

### ✅ New (React Query)

```tsx
// lib/supabase/queries.ts
export function usePersons(userId) {
  return useQuery({
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
}

// Component
function Component() {
  const { data: persons, isLoading, error } = usePersons(userId)
  // That's it! No useEffect needed
}
```

**Benefits:**
- ✅ Automatic caching
- ✅ Automatic refetch
- ✅ Loading/error states built-in
- ✅ Request deduplication
- ✅ Stale-while-revalidate

---

## 3. From useEffect Fetching → React Query

### ❌ Old (Manual useEffect)

```tsx
function Component() {
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    
    supabase
      .from('persons')
      .select('*')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) {
            setError(error)
          } else {
            setPersons(data)
          }
          setLoading(false)
        }
      })
    
    return () => {
      cancelled = true
    }
  }, [userId])
}
```

**Problems:**
- Boilerplate code
- Race conditions
- Manual cleanup
- No caching

### ✅ New (React Query)

```tsx
function Component() {
  const { data: persons, isLoading, error } = usePersons(userId)
  // Done!
}
```

---

## 4. From Manual Realtime → React Query Integration

### ❌ Old (Manual cache update)

```tsx
function Component() {
  const [persons, setPersons] = useState([])
  
  useEffect(() => {
    // Fetch initial data
    fetchPersons().then(setPersons)
    
    // Setup realtime
    const channel = supabase
      .channel('persons')
      .on('postgres_changes', { ... }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPersons((old) => [...old, payload.new])
        }
        // ... manual handling cho UPDATE, DELETE
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
```

**Problems:**
- Duplicate data source
- Manual sync logic
- Cache inconsistency

### ✅ New (React Query + Realtime hook)

```tsx
function Component() {
  // React Query cho data
  const { data: persons } = usePersons(userId)
  
  // Realtime auto update React Query cache
  useRealtimePersons(userId)
  
  // That's it! persons auto updates via realtime
}
```

---

## 5. From Props Drilling → Zustand

### ❌ Old (Props drilling)

```tsx
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <Header setSidebarOpen={setSidebarOpen} />
      <Content sidebarOpen={sidebarOpen}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </Content>
    </Layout>
  )
}
```

**Problems:**
- Props drilling
- Verbose
- Tight coupling

### ✅ New (Zustand)

```tsx
function App() {
  return (
    <Layout>
      <Header />
      <Content>
        <Sidebar />
      </Content>
    </Layout>
  )
}

function Header() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  return <button onClick={toggleSidebar}>Toggle</button>
}

function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  return <div>{sidebarOpen ? 'Open' : 'Closed'}</div>
}
```

---

## 6. From Context API → Zustand

### ❌ Old (Context boilerplate)

```tsx
// context/UIContext.tsx
const UIContext = createContext()

export function UIProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  
  const value = {
    sidebarOpen,
    setSidebarOpen,
    modalOpen,
    setModalOpen,
    selectedId,
    setSelectedId,
  }
  
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const context = useContext(UIContext)
  if (!context) throw new Error('useUI must be within UIProvider')
  return context
}
```

**Problems:**
- Boilerplate
- Re-renders on ANY state change
- Verbose

### ✅ New (Zustand)

```tsx
// stores/ui-store.ts
export const createUIStore = () => {
  return createStore((set) => ({
    sidebarOpen: false,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    modalOpen: false,
    setModalOpen: (open) => set({ modalOpen: open }),
    selectedId: null,
    setSelectedId: (id) => set({ selectedId: id }),
  }))
}

// providers/ui-store-provider.tsx - One-time setup
// Usage - Clean and optimized
const sidebarOpen = useUIStore((state) => state.sidebarOpen)
```

**Benefits:**
- ✅ Less boilerplate
- ✅ Optimized re-renders (với selector)
- ✅ Simpler API

---

## 7. From Manual Optimistic Updates → React Query

### ❌ Old (Manual optimistic)

```tsx
async function handleDelete(id) {
  // Optimistic update
  setPersons((old) => old.filter((p) => p.id !== id))
  
  try {
    await supabase.from('persons').delete().eq('id', id)
  } catch (error) {
    // Rollback on error - OOPS, lost previous state!
    fetchPersons() // Refetch everything
  }
}
```

**Problems:**
- Manual rollback
- Lost previous state
- Race conditions

### ✅ New (React Query mutations)

```tsx
const deletePerson = useMutation({
  mutationFn: (id) => supabase.from('persons').delete().eq('id', id),
  
  onMutate: async (id) => {
    await queryClient.cancelQueries(['persons'])
    const previous = queryClient.getQueryData(['persons'])
    
    queryClient.setQueryData(['persons'], (old) =>
      old.filter((p) => p.id !== id)
    )
    
    return { previous }
  },
  
  onError: (err, id, context) => {
    queryClient.setQueryData(['persons'], context.previous)
  },
  
  onSettled: () => {
    queryClient.invalidateQueries(['persons'])
  },
})
```

---

## 📋 Migration Checklist

### Phase 1: Setup Dependencies

- [ ] Install `@tanstack/react-query`
- [ ] Install `zustand`
- [ ] Setup QueryClientProvider
- [ ] Setup Zustand Provider (if App Router)

### Phase 2: Migrate Server Data

- [ ] Identify all server data in Zustand stores
- [ ] Create React Query hooks for each endpoint
- [ ] Replace Zustand fetching with React Query hooks
- [ ] Remove server data from Zustand stores

### Phase 3: Migrate UI State

- [ ] Convert global Zustand stores to Provider pattern
- [ ] Identify props drilling patterns
- [ ] Move shared UI state to Zustand
- [ ] Update components to use Zustand selectors

### Phase 4: Migrate Realtime

- [ ] Create `useRealtime*` hooks
- [ ] Integrate with React Query cache
- [ ] Remove manual realtime handling
- [ ] Test cache updates

### Phase 5: Cleanup

- [ ] Remove old Context providers
- [ ] Remove manual loading/error states
- [ ] Remove useEffect fetching
- [ ] Update tests

---

## ⚡ Quick Wins (Easiest migrations)

1. **useEffect fetching → React Query** (instant improvement)
2. **Props drilling → Zustand** (cleaner code)
3. **Manual loading states → React Query** (less code)

## 🎯 Priority Order

1. Server data to React Query (biggest impact)
2. Global Zustand to Provider pattern (fix bugs)
3. Props drilling to Zustand (better DX)
4. Realtime integration (better UX)

---

Happy migrating! 🚀
