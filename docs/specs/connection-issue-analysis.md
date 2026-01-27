# 🔍 Connection Loss Issue - Root Cause Analysis

## Vấn đề: "Khi thêm người mới, connections bị mất"

### 🎯 Root Causes (Có thể có nhiều nguyên nhân)

#### 1. **ReactFlow Auto Layout Reset** (Most Likely)
**Triệu chứng:**
- Thêm person mới → Tree re-render với Dagre layout
- Dagre recalculate TẤT CẢ positions
- Nodes jump to new positions
- User THẤY như connections "bị mất" vì everything moved

**Proof:**
```tsx
// components/FamilyTree.tsx - Current implementation
const layoutedNodes = getLayoutedElements(nodes, edges)

// Mỗi khi persons/relationships change → Dagre recalculate ALL
// → Positions không stable → User confused
```

**Solution:** Persist node positions + only layout NEW nodes

---

#### 2. **React Query Cache Not Syncing**
**Triệu chứng:**
- Create person → optimistic update works
- But relationships query not invalidated properly
- User sees person but not relationships

**Check:**
```tsx
// lib/supabase/queries.ts
const createPerson = useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries(['persons']) // ✅ Good
    // But missing:
    queryClient.invalidateQueries(['relationships']) // ❌ Missing?
  }
})
```

---

#### 3. **Realtime Subscription Race Condition**
**Triệu chứng:**
- Person added via mutation
- Realtime event comes in
- Two updates conflict
- State temporarily inconsistent

**Check:**
```tsx
// lib/supabase/realtime.ts
// Are we handling both optimistic updates AND realtime events?
// Potential double-add or timing issues
```

---

#### 4. **Database Relationships Not Persisting**
**Triệu chứng:**
- Relationships SEEM to be created
- But not actually saved to DB
- Page refresh → relationships gone

**Check:**
```sql
-- Verify RLS policies allow INSERT
SELECT * FROM pg_policies WHERE tablename = 'relationships';

-- Check if relationships actually exist
SELECT * FROM relationships WHERE user_id = 'your-user-id';
```

---

## 🔧 Solutions

### Solution 1: Persist Node Positions (Recommended)

**Add `node_positions` column to persons table:**

```sql
-- Migration: Add position persistence
ALTER TABLE persons 
ADD COLUMN position_x INTEGER DEFAULT 0,
ADD COLUMN position_y INTEGER DEFAULT 0;

-- Or create separate table for better structure
CREATE TABLE node_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(person_id, user_id)
);

ALTER TABLE node_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own positions"
  ON node_positions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Update FamilyTree component:**

```tsx
// components/FamilyTree.tsx
'use client'

import { useCallback, useState, useEffect } from 'react'
import ReactFlow, { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState,
  NodeChange,
  applyNodeChanges,
} from 'reactflow'
import { useUpdateNodePosition } from '@/lib/supabase/queries'

export function FamilyTree({ persons, relationships }: FamilyTreeProps) {
  const updatePosition = useUpdateNodePosition()
  
  // Convert persons to nodes with persisted positions
  const initialNodes = persons.map((person) => ({
    id: person.id,
    type: 'custom',
    position: {
      x: person.position_x || 0,
      y: person.position_y || 0,
    },
    data: { person },
  }))

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    relationshipsToEdges(relationships)
  )

  // Auto-layout ONLY for nodes without positions
  useEffect(() => {
    const nodesWithoutPositions = nodes.filter(
      (node) => node.position.x === 0 && node.position.y === 0
    )

    if (nodesWithoutPositions.length > 0) {
      // Only layout new nodes
      const layouted = layoutNewNodes(nodes, edges, nodesWithoutPositions)
      setNodes(layouted)
    }
  }, [persons.length]) // Only when person count changes

  // Save positions on drag end
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      updatePosition.mutate({
        personId: node.id,
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      })
    },
    [updatePosition]
  )

  // Update nodes when persons change (but keep positions)
  useEffect(() => {
    setNodes((currentNodes) => {
      return persons.map((person) => {
        const existingNode = currentNodes.find((n) => n.id === person.id)
        
        return {
          id: person.id,
          type: 'custom',
          position: existingNode?.position || {
            x: person.position_x || 0,
            y: person.position_y || 0,
          },
          data: { person },
        }
      })
    })
  }, [persons])

  // Update edges when relationships change
  useEffect(() => {
    setEdges(relationshipsToEdges(relationships))
  }, [relationships])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStop={onNodeDragStop}
      fitView
      // ... other props
    />
  )
}

// Helper: Layout only new nodes without disrupting existing ones
function layoutNewNodes(
  allNodes: Node[],
  edges: Edge[],
  newNodes: Node[]
): Node[] {
  // Use Dagre only for new nodes
  // Place them near their connected nodes if possible
  
  const layouted = [...allNodes]
  
  newNodes.forEach((newNode) => {
    // Find connected nodes
    const connectedEdges = edges.filter(
      (e) => e.source === newNode.id || e.target === newNode.id
    )
    
    if (connectedEdges.length > 0) {
      // Place near first connected node
      const firstConnection = connectedEdges[0]
      const connectedNodeId = 
        firstConnection.source === newNode.id 
          ? firstConnection.target 
          : firstConnection.source
      
      const connectedNode = allNodes.find((n) => n.id === connectedNodeId)
      
      if (connectedNode) {
        // Place to the right with some offset
        const index = layouted.findIndex((n) => n.id === newNode.id)
        layouted[index] = {
          ...newNode,
          position: {
            x: connectedNode.position.x + 250,
            y: connectedNode.position.y,
          },
        }
      }
    } else {
      // No connections - place at bottom
      const maxY = Math.max(...allNodes.map((n) => n.position.y))
      const index = layouted.findIndex((n) => n.id === newNode.id)
      layouted[index] = {
        ...newNode,
        position: {
          x: 100,
          y: maxY + 150,
        },
      }
    }
  })
  
  return layouted
}
```

**Add mutation in queries.ts:**

```tsx
// lib/supabase/queries.ts

export function useUpdateNodePosition() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ personId, x, y }: { 
      personId: string
      x: number
      y: number 
    }) => {
      const { error } = await supabase
        .from('persons')
        .update({ position_x: x, position_y: y })
        .eq('id', personId)
      
      if (error) throw error
    },
    // Don't invalidate - just let it save silently
  })
}
```

---

### Solution 2: Fix React Query Cache Invalidation

**Ensure all related queries are invalidated:**

```tsx
// lib/supabase/queries.ts

export function useCreatePerson() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (person: PersonInsert) => {
      const { data, error } = await supabase
        .from('persons')
        .insert(person)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (newPerson) => {
      // Invalidate ALL related queries
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      queryClient.invalidateQueries({ queryKey: ['relationships'] }) // ← IMPORTANT
      
      // Also refetch immediately
      queryClient.refetchQueries({ queryKey: ['persons', newPerson.user_id] })
    },
  })
}
```

---

### Solution 3: Debounce Realtime + Optimistic Updates

**Prevent race conditions:**

```tsx
// lib/supabase/realtime.ts

export function useRealtimePersons(userId: string) {
  const queryClient = useQueryClient()
  const lastUpdateRef = useRef<number>(0)
  
  useEffect(() => {
    const channel = supabase
      .channel(`persons-${userId}`)
      .on('postgres_changes', { ... }, (payload) => {
        const now = Date.now()
        
        // Debounce: ignore if update too soon after last one
        if (now - lastUpdateRef.current < 100) {
          return
        }
        lastUpdateRef.current = now
        
        // Update cache
        if (payload.eventType === 'INSERT') {
          queryClient.setQueryData(['persons', userId], (old: Person[]) => {
            // Check if already exists (from optimistic update)
            const exists = old?.some((p) => p.id === payload.new.id)
            if (exists) return old
            
            return old ? [payload.new as Person, ...old] : [payload.new as Person]
          })
        }
        // ... handle UPDATE, DELETE
      })
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [userId, queryClient])
}
```

---

### Solution 4: Add "Reset Layout" Button

**User control over layout:**

```tsx
// components/FamilyTree.tsx

export function FamilyTree({ persons, relationships }: Props) {
  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(initialEdges)
  
  const handleResetLayout = useCallback(() => {
    // Re-run Dagre layout for ALL nodes
    const layouted = getLayoutedElements(nodes, edges)
    setNodes(layouted)
    
    // Optionally save new positions
    layouted.forEach((node) => {
      updatePosition.mutate({
        personId: node.id,
        x: node.position.x,
        y: node.position.y,
      })
    })
  }, [nodes, edges])
  
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-10 space-x-2">
        <Button onClick={handleResetLayout} variant="outline">
          Reset Layout
        </Button>
        <Button onClick={() => /* fit view */}>
          Fit to Screen
        </Button>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        // ...
      />
    </div>
  )
}
```

---

## 🧪 Testing Checklist

After implementing fixes:

### Test Scenario 1: Add Person Without Relationships
- [ ] Create new person
- [ ] Check existing persons didn't move
- [ ] New person appears in correct location
- [ ] No console errors

### Test Scenario 2: Add Person With Relationship
- [ ] Create person with parent relationship
- [ ] Parent node should stay in place
- [ ] New node appears near parent
- [ ] Edge draws correctly

### Test Scenario 3: Drag and Save
- [ ] Drag node to new position
- [ ] Refresh page
- [ ] Node stays in new position
- [ ] Relationships still connected

### Test Scenario 4: Realtime Updates
- [ ] Open app in 2 tabs
- [ ] Add person in tab 1
- [ ] Tab 2 should update
- [ ] No duplicate persons
- [ ] Connections intact

---

## 📊 Quick Diagnosis

Run this to check your current state:

```tsx
// Add to DashboardClient.tsx temporarily

useEffect(() => {
  console.log('=== DEBUG INFO ===')
  console.log('Persons count:', persons.length)
  console.log('Relationships count:', relationships.length)
  console.log('Persons:', persons.map(p => ({ id: p.id, name: p.name })))
  console.log('Relationships:', relationships.map(r => ({
    parent: persons.find(p => p.id === r.parent_id)?.name,
    child: persons.find(p => p.id === r.child_id)?.name,
    type: r.relationship_type
  })))
}, [persons, relationships])
```

Check console khi add new person:
- Persons count increase? ✅
- Relationships still there? ✅
- No duplicates? ✅

---

## 🎯 Recommended Implementation Order

1. **First:** Add debug logging (see above) to understand exact issue
2. **Second:** Implement Solution 2 (Fix cache invalidation) - easiest fix
3. **Third:** Implement Solution 1 (Persist positions) - best UX
4. **Fourth:** Add Reset Layout button - user control

---

## ⚡ Quick Fix (If No Time)

Simplest temporary solution:

```tsx
// components/FamilyTree.tsx

const [layoutKey, setLayoutKey] = useState(0)

// Only re-layout when explicitly requested
const handleReLayout = () => {
  setLayoutKey(k => k + 1)
}

useEffect(() => {
  // Layout on mount and when key changes
  const layouted = getLayoutedElements(nodes, edges)
  setNodes(layouted)
}, [layoutKey]) // NOT on persons/relationships change

return (
  <>
    <Button onClick={handleReLayout}>Re-layout Tree</Button>
    <ReactFlow nodes={nodes} edges={edges} />
  </>
)
```

This prevents auto-relayout but gives user control.
