# 🎯 State Management Decision Guide

Guide chi tiết để quyết định dùng **React Query**, **Zustand**, hay **useState** cho từng use case.

## 📊 Quick Decision Tree

```
Cần manage state?
│
├─ Data từ server (DB, API)?
│  └─ ✅ React Query
│
├─ UI state cần share nhiều components?
│  ├─ Simple (1-2 values)?
│  │  └─ ⚠️ Props / Context
│  │
│  └─ Complex (3+ values, nhiều actions)?
│     └─ ✅ Zustand
│
└─ Local component state?
   └─ ✅ useState
```

## 📋 Detailed Comparison

### 1️⃣ Server Data (Database, API)

| Scenario | Solution | Example |
|----------|----------|---------|
| Fetch từ database | React Query | `usePersons(userId)` |
| Create/Update/Delete | React Query mutations | `useCreatePerson()` |
| Realtime data | React Query + Supabase | `useRealtimePersons()` |
| Cached API calls | React Query | Auto caching |
| Optimistic updates | React Query | `onMutate` |

**Why React Query?**
- ✅ Built-in caching
- ✅ Automatic refetch
- ✅ Loading/error states
- ✅ Optimistic updates
- ✅ Request deduplication
- ✅ Stale-while-revalidate

**Example:**
```tsx
// ✅ ĐÚNG
const { data: persons, isLoading } = usePersons(userId)

// ❌ SAI - Không dùng Zustand cho server data
const persons = useStore((state) => state.persons)
```

---

### 2️⃣ UI State (Modal, Sidebar, Tabs...)

| State Type | Solution | Why? |
|------------|----------|------|
| Modal open/closed | Zustand | Share across components |
| Sidebar collapsed | Zustand | Persist across pages |
| Selected item ID | Zustand | Global selection |
| Theme (dark/light) | Zustand | Global setting |
| Toast notifications | Zustand | Trigger from anywhere |
| Form wizard step | Zustand | Complex multi-step |

**Why Zustand?**
- ✅ No Provider boilerplate*
- ✅ Simple API
- ✅ TypeScript friendly
- ✅ Dev tools
- ✅ Middleware support

*Note: Vẫn cần Provider trong Next.js App Router, nhưng syntax đơn giản hơn Context API rất nhiều.

**Example:**
```tsx
// ✅ ĐÚNG
const sidebarOpen = useUIStore((state) => state.sidebarOpen)
const toggleSidebar = useUIStore((state) => state.toggleSidebar)

// ❌ SAI - Không cần React Query cho UI state
const { data: sidebarOpen } = useQuery(['sidebar'], ...)
```

---

### 3️⃣ Form State

| Form Type | Solution | Why? |
|-----------|----------|------|
| Simple form (1-3 fields) | useState | No overhead |
| Complex form (5+ fields) | React Hook Form | Validation, performance |
| Multi-step wizard | Zustand | Share across steps |
| Form draft autosave | React Query | Sync to server |

**Simple Form:**
```tsx
// ✅ ĐÚNG - Simple form
const [name, setName] = useState('')
const [email, setEmail] = useState('')
```

**Complex Form:**
```tsx
// ✅ ĐÚNG - Complex form với validation
import { useForm } from 'react-hook-form'

const { register, handleSubmit } = useForm()
```

**Multi-step Wizard:**
```tsx
// ✅ ĐÚNG - Share state across steps
const currentStep = useUIStore((state) => state.wizardStep)
const formData = useUIStore((state) => state.wizardData)
```

---

### 4️⃣ Local Component State

| Scenario | Solution | Example |
|----------|----------|---------|
| Input value | useState | `const [value, setValue] = useState('')` |
| Toggle state | useState | `const [open, setOpen] = useState(false)` |
| Hover state | useState | `const [hovered, setHovered] = useState(false)` |
| Loading state* | useState | `const [loading, setLoading] = useState(false)` |

*Note: Nếu loading state cho API call, dùng React Query vì nó có built-in `isLoading`.

**Example:**
```tsx
// ✅ ĐÚNG - Local state
function Component() {
  const [expanded, setExpanded] = useState(false)
  return <div onClick={() => setExpanded(!expanded)} />
}

// ❌ SAI - Không cần Zustand cho local state
const expanded = useStore((state) => state.expandedComponents[id])
```

---

### 5️⃣ URL State (Search Params, Filters)

| Scenario | Solution | Why? |
|----------|----------|------|
| Pagination | nuqs | URL sync |
| Filters | nuqs | Shareable URL |
| Search query | nuqs | Browser back/forward |
| Selected tab | Local state OR nuqs | Depends if shareable |

**Why nuqs?**
- ✅ Type-safe
- ✅ URL sync automatic
- ✅ Server Component compatible
- ✅ No manual parsing

**Example:**
```tsx
// ✅ ĐÚNG - Filter state trong URL
import { parseAsInteger, useQueryState } from 'nuqs'

const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
const [search, setSearch] = useQueryState('search')

// ❌ SAI - Manual URL parsing
const searchParams = useSearchParams()
const page = searchParams.get('page')
```

---

## 🤔 Complex Scenarios

### Scenario 1: Sidebar state + API data

**Question:** Sidebar state và data bên trong sidebar - dùng gì?

**Answer:**
```tsx
// Sidebar state → Zustand
const sidebarOpen = useUIStore((state) => state.sidebarOpen)

// Data bên trong sidebar → React Query
const { data: recentItems } = useRecentItems()
```

---

### Scenario 2: Selected person + person detail

**Question:** Selected person ID và person detail data - dùng gì?

**Answer:**
```tsx
// Selected ID → Zustand (UI state)
const selectedId = useUIStore((state) => state.selectedPersonId)

// Person detail → React Query (server data)
const { data: person } = usePerson(selectedId)
```

---

### Scenario 3: Filter state + filtered results

**Question:** Filter values và filtered data - dùng gì?

**Answer:**
```tsx
// Filter values → nuqs (URL state)
const [search, setSearch] = useQueryState('search')
const [category, setCategory] = useQueryState('category')

// Filtered data → React Query (depends on filters)
const { data: items } = useItems({ search, category })
```

---

### Scenario 4: Form draft autosave

**Question:** Form data cần autosave - dùng gì?

**Answer:**
```tsx
// Local form state → useState
const [formData, setFormData] = useState(initialData)

// Autosave mutation → React Query
const saveDraft = useMutation({
  mutationFn: (data) => supabase.from('drafts').upsert(data)
})

// Autosave effect
useEffect(() => {
  const timer = setTimeout(() => {
    saveDraft.mutate(formData)
  }, 1000)
  return () => clearTimeout(timer)
}, [formData])
```

---

## ⚖️ Comparison Table

| Feature | React Query | Zustand | useState | nuqs |
|---------|-------------|---------|----------|------|
| Server data | ✅ | ❌ | ❌ | ❌ |
| Caching | ✅ | ❌ | ❌ | ❌ |
| Optimistic updates | ✅ | ⚠️ | ❌ | ❌ |
| Global UI state | ❌ | ✅ | ❌ | ❌ |
| Local state | ❌ | ❌ | ✅ | ❌ |
| URL sync | ❌ | ❌ | ❌ | ✅ |
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| Dev tools | ✅ | ✅ | ❌ | ❌ |
| Learning curve | Medium | Low | Low | Low |

---

## 🚫 Anti-Patterns

### ❌ Dùng Zustand cho server data

```tsx
// ❌ BAD
const fetchPersons = useStore((state) => state.fetchPersons)
const persons = useStore((state) => state.persons)

useEffect(() => {
  fetchPersons()
}, [])
```

**Why bad?**
- Phải manual handle loading/error
- Không có caching
- Không có refetch logic
- Duplicate code

**Solution:**
```tsx
// ✅ GOOD
const { data: persons, isLoading, error } = usePersons(userId)
```

---

### ❌ Dùng React Query cho UI state

```tsx
// ❌ BAD
const { data: sidebarOpen } = useQuery({
  queryKey: ['sidebar'],
  queryFn: () => localStorage.getItem('sidebar') === 'true',
})
```

**Why bad?**
- Overhead không cần thiết
- Phải setup fake queryFn
- Confusing API cho simple state

**Solution:**
```tsx
// ✅ GOOD
const sidebarOpen = useUIStore((state) => state.sidebarOpen)
```

---

### ❌ Prop drilling thay vì Zustand

```tsx
// ❌ BAD
<Parent sidebarOpen={sidebarOpen}>
  <Child sidebarOpen={sidebarOpen}>
    <GrandChild sidebarOpen={sidebarOpen}>
      <GreatGrandChild sidebarOpen={sidebarOpen} />
    </GrandChild>
  </Child>
</Parent>
```

**Solution:**
```tsx
// ✅ GOOD - Bất kỳ component nào cũng access được
function GreatGrandChild() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
}
```

---

## 📖 Summary

**Golden Rules:**

1. **Server data** → React Query
2. **Global UI state** → Zustand
3. **Local state** → useState
4. **URL state** → nuqs
5. **Form state** → useState (simple) or React Hook Form (complex)

**When in doubt:**
- Data từ API/DB? → React Query
- UI state cần share? → Zustand
- Chỉ dùng trong 1 component? → useState

**Remember:**
- Không nên dùng 1 tool cho TẤT CẢ state
- Mỗi tool có strengths riêng
- Pick the right tool for the job
