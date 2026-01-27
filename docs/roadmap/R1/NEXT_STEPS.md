# 🎯 Next Steps Roadmap - Glean Family Tree V2

Dựa trên CURRENT_IMPLEMENTATION.md, đây là roadmap ưu tiên theo impact và effort.

## 📊 Priority Matrix

| Phase | Tasks | Impact | Effort | Priority |
|-------|-------|--------|--------|----------|
| **Phase 0** | Cleanup & Stability | Medium | Low | 🔥 URGENT |
| **Phase 1** | UX Improvements | High | Medium | ⭐ HIGH |
| **Phase 2** | Feature Expansion | High | High | ⭐ HIGH |
| **Phase 3** | Polish & Scale | Medium | Medium | 📌 MEDIUM |

---

## 🔥 Phase 0: Cleanup & Stability (1-2 days)

**Goal:** Eliminate technical debt, ensure codebase consistency

### Task 0.1: Delete Legacy Code ✅ Quick Win

```bash
# Delete old store
rm -rf store/

# Verify no imports của store/use-tree-store.ts
grep -r "store/use-tree-store" . --exclude-dir=node_modules
```

**Files to check:**
- `app/dashboard/DashboardClient.tsx` - Should use `providers/ui-store-provider`
- `components/FamilyTree.tsx` - Should use `stores/ui-store`

---

### Task 0.2: Verify State Management Consistency

**Check list:**
- [ ] All components dùng `useUIStore` từ `providers/ui-store-provider`
- [ ] Không còn import trực tiếp từ `stores/ui-store`
- [ ] Server data chỉ dùng React Query hooks
- [ ] Local state dùng `useState`

**Pattern to verify:**
```tsx
// ✅ CORRECT
import { useUIStore } from '@/providers/ui-store-provider'
const sidebarOpen = useUIStore((state) => state.sidebarOpen)

// ❌ WRONG
import { useTreeStore } from '@/store/use-tree-store'
```

---

### Task 0.3: Environment Variables Cleanup

**Current issue:** `.env.local` có comments cho cả Staging và Prod

**Solution:** Tạo separate files:

```bash
# .env.staging
NEXT_PUBLIC_SUPABASE_URL=https://lfaubupwqmujwpwckpfj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-key

# .env.production  
NEXT_PUBLIC_SUPABASE_URL=https://vcsjsqkjopcawdenncfn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key

# .env.local (local dev)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-key
```

**Update package.json:**
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:staging": "env-cmd -f .env.staging next dev",
    "build:staging": "env-cmd -f .env.staging next build",
    "build:production": "env-cmd -f .env.production next build"
  }
}
```

---

## ⭐ Phase 1: UX Improvements (3-5 days)

**Goal:** Polish existing features, improve user experience

### Task 1.1: Upgrade RelationshipModal to Shadcn UI

**Current state:** Dùng native `<select>`, kém UX

**Target:**
```tsx
// components/RelationshipModal.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface RelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  persons: Person[]
  onCreateRelationship: (data: RelationshipData) => Promise<void>
}

export function RelationshipModal({ 
  isOpen, 
  onClose, 
  persons,
  onCreateRelationship 
}: RelationshipModalProps) {
  const [parentId, setParentId] = useState<string>('')
  const [childId, setChildId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!parentId || !childId) return
    
    setIsLoading(true)
    try {
      await onCreateRelationship({
        parent_id: parentId,
        child_id: childId,
        relationship_type: 'parent-child',
      })
      onClose()
      setParentId('')
      setChildId('')
    } catch (error) {
      console.error('Error creating relationship:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Relationship</DialogTitle>
          <DialogDescription>
            Select parent and child to create a family relationship.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="parent">Parent</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger id="parent">
                <SelectValue placeholder="Select parent" />
              </SelectTrigger>
              <SelectContent>
                {persons.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="child">Child</Label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger id="child">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {persons
                  .filter((p) => p.id !== parentId)
                  .map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!parentId || !childId || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Relationship'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 1.2: Add Node Click Interaction

**Goal:** Click node để view/edit person details

**Implementation:**

```tsx
// components/PersonNodeDetail.tsx
'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdatePerson, useDeletePerson } from '@/lib/supabase/queries'
import type { Person } from '@/types/supabase'

interface PersonNodeDetailProps {
  person: Person | null
  isOpen: boolean
  onClose: () => void
}

export function PersonNodeDetail({ person, isOpen, onClose }: PersonNodeDetailProps) {
  const [name, setName] = useState(person?.name || '')
  const [dateOfBirth, setDateOfBirth] = useState(person?.date_of_birth || '')
  
  const updatePerson = useUpdatePerson()
  const deletePerson = useDeletePerson()

  useEffect(() => {
    if (person) {
      setName(person.name)
      setDateOfBirth(person.date_of_birth || '')
    }
  }, [person])

  const handleUpdate = async () => {
    if (!person) return
    
    await updatePerson.mutateAsync({
      id: person.id,
      updates: { name, date_of_birth: dateOfBirth },
    })
    onClose()
  }

  const handleDelete = async () => {
    if (!person) return
    if (!confirm(`Delete ${person.name}?`)) return
    
    await deletePerson.mutateAsync(person.id)
    onClose()
  }

  if (!person) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Person Details</SheetTitle>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Statistics</Label>
            <div className="text-sm text-muted-foreground">
              <p>Created: {new Date(person.created_at).toLocaleDateString()}</p>
              <p>ID: {person.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleUpdate} disabled={updatePerson.isPending}>
            {updatePerson.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deletePerson.isPending}
          >
            {deletePerson.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

**Update FamilyTree.tsx:**
```tsx
// components/FamilyTree.tsx
export function FamilyTree({ persons, relationships }: FamilyTreeProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const person = persons.find((p) => p.id === node.id)
    if (person) {
      setSelectedPerson(person)
      setIsDetailOpen(true)
    }
  }, [persons])

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        // ... other props
      />
      
      <PersonNodeDetail 
        person={selectedPerson}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  )
}
```

---

### Task 1.3: Add Loading Skeletons

**Goal:** Better loading UX instead of blank screens

```tsx
// components/DashboardSkeleton.tsx
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}

// app/dashboard/page.tsx - Add Suspense
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
```

---

## ⭐ Phase 2: Feature Expansion (1 week)

### Task 2.1: Spouse Relationships

**Schema addition:**
```sql
-- Already have relationship_type column, just need to use it

-- Add spouse relationships via UI
-- Update queries.ts to handle spouse type
```

**RelationshipModal enhancement:**
```tsx
const [relationshipType, setRelationshipType] = useState<'parent-child' | 'spouse'>('parent-child')

<Select value={relationshipType} onValueChange={setRelationshipType}>
  <SelectItem value="parent-child">Parent-Child</SelectItem>
  <SelectItem value="spouse">Spouse</SelectItem>
</Select>

{relationshipType === 'parent-child' && (
  // Parent/Child selectors
)}

{relationshipType === 'spouse' && (
  // Person 1 / Person 2 selectors
)}
```

---

### Task 2.2: Circular Relationship Validation

**Add validation hook:**
```tsx
// lib/validation/relationship-validator.ts
export function validateRelationship(
  parentId: string,
  childId: string,
  existingRelationships: Relationship[]
): { valid: boolean; error?: string } {
  // Check if creating a loop
  if (parentId === childId) {
    return { valid: false, error: 'Person cannot be their own parent' }
  }

  // Check if child is already ancestor of parent
  const ancestors = getAncestors(parentId, existingRelationships)
  if (ancestors.includes(childId)) {
    return { 
      valid: false, 
      error: 'This would create a circular relationship' 
    }
  }

  return { valid: true }
}

function getAncestors(
  personId: string, 
  relationships: Relationship[]
): string[] {
  const ancestors: string[] = []
  const queue = [personId]

  while (queue.length > 0) {
    const current = queue.shift()!
    const parents = relationships
      .filter((r) => r.child_id === current && r.relationship_type === 'parent-child')
      .map((r) => r.parent_id)
    
    ancestors.push(...parents)
    queue.push(...parents)
  }

  return ancestors
}
```

---

### Task 2.3: Relationship Management UI

**Add ability to view/delete relationships:**

```tsx
// components/RelationshipList.tsx
export function RelationshipList({ 
  relationships,
  persons 
}: RelationshipListProps) {
  const deleteRelationship = useDeleteRelationship()

  const getPersonName = (id: string) => {
    return persons.find((p) => p.id === id)?.name || 'Unknown'
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Relationships</h3>
      {relationships.map((rel) => (
        <div key={rel.id} className="flex items-center justify-between p-2 border rounded">
          <div className="text-sm">
            <strong>{getPersonName(rel.parent_id)}</strong>
            <span className="text-muted-foreground"> → </span>
            <strong>{getPersonName(rel.child_id)}</strong>
            <span className="text-xs text-muted-foreground ml-2">
              ({rel.relationship_type})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteRelationship.mutate(rel.id)}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  )
}
```

---

## 📌 Phase 3: Polish & Scale (1 week)

### Task 3.1: CI/CD Setup

**GitHub Actions workflow:**
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

### Task 3.2: Error Boundaries

```tsx
// components/ErrorBoundary.tsx
'use client'

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

### Task 3.3: Performance Optimizations

**Add React Query persistence:**
```tsx
// providers/query-provider.tsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

export function QueryProvider({ children }) {
  return (
    <PersistQueryClientProvider 
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
```

---

## 📋 Implementation Checklist

### Phase 0: Cleanup (Do first!)
- [ ] Delete `store/` folder
- [ ] Verify no legacy imports
- [ ] Setup separate env files
- [ ] Test in Staging

### Phase 1: UX  
- [ ] Upgrade RelationshipModal to Shadcn
- [ ] Add PersonNodeDetail component
- [ ] Add loading skeletons
- [ ] Test user flows

### Phase 2: Features
- [ ] Add spouse relationship support
- [ ] Implement validation
- [ ] Add relationship management UI
- [ ] Update graph layout for spouses

### Phase 3: Polish
- [ ] Setup CI/CD
- [ ] Add error boundaries
- [ ] Performance optimization
- [ ] Documentation updates

---

## 🎯 Recommended Priority Order

1. **Phase 0** (Cleanup) - Start immediately
2. **Task 1.2** (Node click) - High user value
3. **Task 1.1** (RelationshipModal) - Better UX
4. **Task 2.2** (Validation) - Prevent bugs
5. **Task 2.1** (Spouse) - Core feature
6. **Phase 3** - Polish

---

**Estimated Timeline:** 2-3 weeks for all phases
**Quick wins:** Phase 0 + Task 1.2 (3-4 days)
