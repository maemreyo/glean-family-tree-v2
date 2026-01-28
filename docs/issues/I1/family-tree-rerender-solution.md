# Giải pháp: Ngăn React Flow Reset Vị Trí Nodes

## 🔍 Phân tích vấn đề

### Nguyên nhân gốc rễ:
```typescript
// Dòng 493-500 trong FamilyTree.tsx
React.useEffect(() => {
  console.log('Layout effect triggered')
  setNodes(layoutedNodes)      // ❌ Reset nodes về layoutedNodes
  setEdges(layoutedEdges)      // ❌ Reset edges về layoutedEdges
}, [layoutedNodes, layoutedEdges, setNodes, setEdges])
```

### Chuỗi sự kiện gây lỗi:
1. User kéo node đến vị trí mới → vị trí được lưu qua `onNodeDragStop`
2. User thực hiện action (create/delete person, update data)
3. React Query refetch → `persons` prop thay đổi
4. `initialNodes` được tính lại (dòng 113-120)
5. `layoutedNodes` được tính lại (dòng 138-150)
6. useEffect trigger → `setNodes(layoutedNodes)` → **NODES BỊ RESET**

## ✅ Giải pháp 1: Sync thông minh với useRef (Recommended)

### Cách hoạt động:
- Chỉ sync nodes/edges lần đầu tiên hoặc khi có thay đổi thực sự về data (thêm/xóa person)
- Giữ nguyên vị trí nodes khi chỉ update data

### Code implementation:

```typescript
'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import ReactFlow, {
  // ... imports
} from 'reactflow'

export function FamilyTree({ userId, persons, relationships: initialRelationships, readOnly = false }: FamilyTreeProps & { relationships?: Relationship[] }) {
  // ... existing code ...

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)
  
  // ✅ Track previous IDs to detect actual changes
  const prevPersonIdsRef = useRef<Set<string>>(new Set())
  const prevRelationshipIdsRef = useRef<Set<string>>(new Set())

  // ✅ Smart sync: only update when persons/relationships change
  React.useEffect(() => {
    const currentPersonIds = new Set(persons.map(p => p.id))
    const currentRelationshipIds = new Set(relationships.map(r => r.id))
    
    const prevPersonIds = prevPersonIdsRef.current
    const prevRelationshipIds = prevRelationshipIdsRef.current
    
    // Check if there are actual changes (add/remove)
    const personsChanged = 
      currentPersonIds.size !== prevPersonIds.size ||
      ![...currentPersonIds].every(id => prevPersonIds.has(id))
    
    const relationshipsChanged =
      currentRelationshipIds.size !== prevRelationshipIds.size ||
      ![...currentRelationshipIds].every(id => prevRelationshipIds.has(id))
    
    // Only update if there are structural changes
    if (personsChanged || relationshipsChanged) {
      console.log('Structural changes detected, updating layout', {
        personsChanged,
        relationshipsChanged,
        added: [...currentPersonIds].filter(id => !prevPersonIds.has(id)),
        removed: [...prevPersonIds].filter(id => !currentPersonIds.has(id))
      })
      
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      
      // Update refs
      prevPersonIdsRef.current = currentPersonIds
      prevRelationshipIdsRef.current = currentRelationshipIds
    } else {
      // Only update node data (không thay đổi position)
      setNodes(currentNodes => 
        currentNodes.map(node => {
          const updatedPerson = persons.find(p => p.id === node.id)
          if (updatedPerson) {
            return {
              ...node,
              data: { ...node.data, ...updatedPerson }
            }
          }
          return node
        })
      )
    }
  }, [layoutedNodes, layoutedEdges, persons, relationships, setNodes, setEdges])

  // ... rest of the code ...
}
```

## ✅ Giải pháp 2: Tách logic sync data vs sync layout

### Ưu điểm:
- Rõ ràng hơn về mục đích của từng effect
- Dễ debug và maintain

```typescript
export function FamilyTree({ userId, persons, relationships: initialRelationships, readOnly = false }: FamilyTreeProps & { relationships?: Relationship[] }) {
  // ... existing code ...

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)
  
  const isInitializedRef = useRef(false)
  const personIdsRef = useRef<string[]>([])

  // Effect 1: Initialize nodes/edges once
  React.useEffect(() => {
    if (!isInitializedRef.current) {
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      personIdsRef.current = persons.map(p => p.id)
      isInitializedRef.current = true
    }
  }, [])

  // Effect 2: Update only when persons/relationships are added/removed
  React.useEffect(() => {
    if (!isInitializedRef.current) return

    const currentPersonIds = persons.map(p => p.id).sort()
    const prevPersonIds = personIdsRef.current.sort()
    
    const hasStructuralChange = 
      currentPersonIds.length !== prevPersonIds.length ||
      currentPersonIds.some((id, i) => id !== prevPersonIds[i])

    if (hasStructuralChange) {
      console.log('Structural change detected, re-layouting')
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      personIdsRef.current = persons.map(p => p.id)
    }
  }, [persons.length, relationships.length, layoutedNodes, layoutedEdges])

  // Effect 3: Update node data only (không thay đổi position)
  React.useEffect(() => {
    if (!isInitializedRef.current) return

    setNodes(currentNodes => 
      currentNodes.map(node => {
        const updatedPerson = persons.find(p => p.id === node.id)
        if (updatedPerson) {
          return {
            ...node,
            data: { ...node.data, ...updatedPerson }
          }
        }
        return node
      })
    )
  }, [persons, setNodes])

  // ... rest of the code ...
}
```

## ✅ Giải pháp 3: Sử dụng React Flow's controlled mode đúng cách

### Approach: Quản lý state hoàn toàn thủ công

```typescript
export function FamilyTree({ userId, persons, relationships: initialRelationships, readOnly = false }: FamilyTreeProps & { relationships?: Relationship[] }) {
  // ... existing code ...

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const initializedRef = useRef(false)

  // Initialize once
  React.useEffect(() => {
    if (!initializedRef.current && layoutedNodes.length > 0) {
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      initializedRef.current = true
    }
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges])

  // Sync new persons/relationships
  const prevCountRef = useRef({ persons: 0, relationships: 0 })
  
  React.useEffect(() => {
    if (!initializedRef.current) return

    const prevCounts = prevCountRef.current
    const hasNewPersons = persons.length > prevCounts.persons
    const hasNewRelationships = relationships.length > prevCounts.relationships
    const hasRemovedItems = 
      persons.length < prevCounts.persons || 
      relationships.length < prevCounts.relationships

    if (hasNewPersons || hasNewRelationships || hasRemovedItems) {
      // Get current positions
      const currentPositions = new Map(
        nodes.map(node => [node.id, node.position])
      )

      // Update nodes while preserving positions
      const updatedNodes = layoutedNodes.map(node => ({
        ...node,
        position: currentPositions.get(node.id) || node.position
      }))

      setNodes(updatedNodes)
      setEdges(layoutedEdges)
      
      prevCountRef.current = {
        persons: persons.length,
        relationships: relationships.length
      }
    }
  }, [persons.length, relationships.length, layoutedNodes, layoutedEdges, nodes, setNodes, setEdges])

  // ... rest of the code ...
}
```

## 🎯 Recommendation

**Khuyến nghị sử dụng Giải pháp 1** vì:

1. ✅ **Chính xác**: Phát hiện chính xác khi có thêm/xóa person/relationship
2. ✅ **Performance tốt**: Chỉ re-layout khi thực sự cần
3. ✅ **Dễ hiểu**: Logic rõ ràng, dễ maintain
4. ✅ **Giữ nguyên UX**: User không bị mất vị trí đã sắp xếp

## 🔧 Bonus: Thêm visual feedback khi saving positions

```typescript
const [isSavingPosition, setIsSavingPosition] = React.useState(false)

const onNodeDragStop: NodeDragHandler = useCallback(
  async (_, node) => {
    if (readOnly) return

    setIsSavingPosition(true)
    try {
      await updatePerson({
        id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
      })
      // Optional: show toast
      toast.success('Position saved', { duration: 1000 })
    } finally {
      setTimeout(() => setIsSavingPosition(false), 300)
    }
  },
  [updatePerson, readOnly]
)

// Add to ReactFlow Panel
<Panel position="bottom-right">
  {isSavingPosition && (
    <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
      Saving position...
    </div>
  )}
</Panel>
```

## 📝 Testing checklist

Sau khi apply solution, test các scenarios:

- [ ] Kéo node → reload page → vị trí được giữ nguyên
- [ ] Thêm person mới → nodes cũ giữ nguyên vị trí
- [ ] Xóa person → nodes còn lại giữ nguyên vị trí
- [ ] Update person data (name, bio) → nodes không bị reset
- [ ] Thêm relationship → layout không bị reset
- [ ] Search/filter → không ảnh hưởng đến vị trí
- [ ] Auto Layout button → vẫn hoạt động bình thường

## 🚀 Next steps

1. Apply Giải pháp 1
2. Test thoroughly
3. Nếu cần optimize thêm → consider memoization cho các computed values
4. Add loading states cho better UX
