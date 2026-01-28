# Code Examples & Snippets

## Example 1: Creating Spouse Relationship in UI

```typescript
// In your person modal or form
const handleAddSpouse = async () => {
  await createRelationship({
    user_id: userId,
    from_person_id: currentPersonId,
    to_person_id: spousePersonId,
    type: 'spouse', // Important: use 'spouse' type
  })
}
```

## Example 2: Custom Edge Styling (modify SpouseEdge.tsx)

### Purple Theme
```typescript
// Change from pink to purple
<path
  style={{
    strokeWidth: 3,
    stroke: '#8b5cf6', // purple-500 instead of pink-500
    strokeDasharray: '8, 4',
  }}
/>

<div className="bg-purple-100 rounded-full p-1 border-2 border-purple-500">
  <Heart className="h-3 w-3 text-purple-500 fill-purple-500" />
</div>
```

### Red Theme
```typescript
stroke: '#ef4444', // red-500
className="bg-red-100 border-red-500"
className="text-red-500 fill-red-500"
```

### Gold Theme (for special occasions)
```typescript
stroke: '#f59e0b', // amber-500
className="bg-amber-100 border-amber-500"
className="text-amber-500 fill-amber-500"
```

## Example 3: Adjusting Layout Spacing

### Tighter Layout (for small screens)
```typescript
// In dagre-layout.ts
const nodeWidth = 180      // was 200
const nodeHeight = 45      // was 50
const spouseGap = 30       // was 50

dagreGraph.setGraph({ 
  rankdir: direction,
  nodesep: 60,             // was 80
  ranksep: 80,             // was 100
  edgesep: 40,             // was 50
})
```

### Wider Layout (for presentations)
```typescript
const nodeWidth = 220      // was 200
const nodeHeight = 60      // was 50
const spouseGap = 80       // was 50

dagreGraph.setGraph({ 
  rankdir: direction,
  nodesep: 100,            // was 80
  ranksep: 150,            // was 100
  edgesep: 60,             // was 50
})
```

## Example 4: Adding Marriage Date to Edge Label

```typescript
// In SpouseEdge.tsx, add after heart icon
<foreignObject
  width={100}
  height={20}
  x={labelX - 50}
  y={labelY + 20}
  className="overflow-visible"
>
  <div className="flex items-center justify-center text-xs text-gray-600">
    {data?.marriageDate && (
      <span>
        {new Date(data.marriageDate).getFullYear()}
      </span>
    )}
  </div>
</foreignObject>

// Update edge data in dagre-layout.ts
{
  ...edge,
  data: {
    ...edge.data,
    marriageDate: edge.marriageDate, // Pass through marriage date
  },
  type: 'spouse',
}
```

## Example 5: Different Icons for Different Spouse Types

```typescript
// In PersonNode.tsx
const getSpouseIcon = (spouseType: string) => {
  switch (spouseType) {
    case 'married':
      return <Heart className="h-3 w-3 fill-white" />
    case 'divorced':
      return <HeartCrack className="h-3 w-3" />
    case 'widowed':
      return <HeartOff className="h-3 w-3" />
    default:
      return <Heart className="h-3 w-3 fill-white" />
  }
}

// Usage in badge
<div className="bg-pink-500 text-white rounded-full h-5 w-5 flex items-center justify-center">
  {getSpouseIcon(data.spouseType)}
</div>
```

## Example 6: Filtering to Show Only Married People

```typescript
// In your filter component
const [showOnlyMarried, setShowOnlyMarried] = useState(false)

const filteredNodes = showOnlyMarried 
  ? nodes.filter(node => node.data.spouseCount > 0)
  : nodes

// Use filteredNodes in ReactFlow
<ReactFlow
  nodes={filteredNodes}
  edges={edges}
  ...
/>
```

## Example 7: Spouse Search Function

```typescript
// Find all spouses of a person
const findSpouses = (personId: string, relationships: Relationship[]) => {
  return relationships
    .filter(rel => 
      rel.type === 'spouse' && 
      (rel.from_person_id === personId || rel.to_person_id === personId)
    )
    .map(rel => 
      rel.from_person_id === personId 
        ? rel.to_person_id 
        : rel.from_person_id
    )
}

// Usage
const spouseIds = findSpouses('person-123', relationships)
const spouseNames = spouseIds.map(id => 
  persons.find(p => p.id === id)?.name
).join(', ')
```

## Example 8: Custom Badge Styling

```typescript
// Gradient badge
<div className="absolute -top-2 -right-2 z-10">
  <div className="bg-gradient-to-br from-pink-400 to-pink-600 text-white rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-lg">
    <Heart className="h-3 w-3 fill-white" />
  </div>
</div>

// Animated pulse badge
<div className="absolute -top-2 -right-2 z-10 animate-pulse">
  <div className="bg-pink-500 text-white rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-md">
    <Heart className="h-3 w-3 fill-white" />
  </div>
</div>

// Glass morphism badge
<div className="absolute -top-2 -right-2 z-10">
  <div className="bg-white/20 backdrop-blur-sm text-pink-600 rounded-full h-6 w-6 flex items-center justify-center border border-pink-300 shadow-lg">
    <Heart className="h-3 w-3 fill-pink-500" />
  </div>
</div>
```

## Example 9: Responsive Badge Sizes

```typescript
// In PersonNode.tsx
const badgeSize = () => {
  if (window.innerWidth < 768) return 'h-4 w-4' // mobile
  if (window.innerWidth < 1024) return 'h-5 w-5' // tablet
  return 'h-6 w-6' // desktop
}

<div className={`bg-pink-500 text-white rounded-full ${badgeSize()} flex items-center justify-center`}>
  <Heart className="h-3 w-3 fill-white" />
</div>
```

## Example 10: Interactive Spouse Selection

```typescript
// Highlight connected spouses on hover
const [hoveredNode, setHoveredNode] = useState<string | null>(null)

const getNodeClassName = (nodeId: string) => {
  const isHovered = hoveredNode === nodeId
  const isSpouseOfHovered = hoveredNode && 
    relationships.some(rel => 
      rel.type === 'spouse' &&
      ((rel.from_person_id === hoveredNode && rel.to_person_id === nodeId) ||
       (rel.to_person_id === hoveredNode && rel.from_person_id === nodeId))
    )
  
  if (isHovered) return 'ring-4 ring-pink-400'
  if (isSpouseOfHovered) return 'ring-2 ring-pink-300'
  return ''
}

// In PersonNode.tsx
<div 
  className={`... ${getNodeClassName(data.id)}`}
  onMouseEnter={() => setHoveredNode(data.id)}
  onMouseLeave={() => setHoveredNode(null)}
>
  ...
</div>
```

## Example 11: Export with Spouse Highlights

```typescript
// Before exporting, highlight all spouse relationships
const highlightSpousesForExport = () => {
  const updatedNodes = nodes.map(node => ({
    ...node,
    className: node.data.spouseCount > 0 
      ? 'ring-2 ring-pink-400' 
      : ''
  }))
  
  setNodes(updatedNodes)
  
  // Export after a short delay to apply styles
  setTimeout(() => {
    onExport()
  }, 100)
}
```

## Example 12: Spouse Statistics Component

```typescript
// Create a stats component
const SpouseStats = ({ persons, relationships }: Props) => {
  const spouseRelationships = relationships.filter(r => r.type === 'spouse')
  const peopleWithSpouses = new Set(
    spouseRelationships.flatMap(r => [r.from_person_id, r.to_person_id])
  )
  
  const polygamyCases = Array.from(peopleWithSpouses).filter(personId => {
    const spouseCount = spouseRelationships.filter(r => 
      r.from_person_id === personId || r.to_person_id === personId
    ).length
    return spouseCount > 1
  })
  
  return (
    <div className="stats-card">
      <div>Total Marriages: {spouseRelationships.length}</div>
      <div>People Married: {peopleWithSpouses.size}</div>
      <div>Polygamy Cases: {polygamyCases.length}</div>
      <div>Single People: {persons.length - peopleWithSpouses.size}</div>
    </div>
  )
}
```

## Example 13: Conditional Edge Styling Based on Data

```typescript
// In SpouseEdge.tsx
const edgeStyle = () => {
  // Active marriage
  if (data?.isActive) {
    return { stroke: '#ec4899', strokeWidth: 3 }
  }
  // Divorced
  if (data?.isDivorced) {
    return { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '4, 4' }
  }
  // Widowed
  if (data?.isWidowed) {
    return { stroke: '#6b7280', strokeWidth: 2 }
  }
  return { stroke: '#ec4899', strokeWidth: 3 }
}

<path
  style={edgeStyle()}
  ...
/>
```

## Example 14: Bulk Spouse Operations

```typescript
// Add multiple spouses at once
const addMultipleSpouses = async (
  mainPersonId: string, 
  spouseIds: string[]
) => {
  const relationships = spouseIds.map(spouseId => ({
    user_id: userId,
    from_person_id: mainPersonId,
    to_person_id: spouseId,
    type: 'spouse' as const,
  }))
  
  await Promise.all(
    relationships.map(rel => createRelationship(rel))
  )
  
  toast.success(`Added ${spouseIds.length} spouses`)
}
```

## Example 15: Migration Script (for existing data)

```typescript
// Convert old relationship format to new spouse format
const migrateToSpouseRelationships = async () => {
  const oldSpouseRelationships = relationships.filter(r => 
    r.relationship_type === 'married' // old format
  )
  
  for (const rel of oldSpouseRelationships) {
    await supabase
      .from('relationships')
      .update({ type: 'spouse' })
      .eq('id', rel.id)
  }
  
  toast.success('Migration complete')
}
```

---

## 🔧 Utility Functions

### Get All Spouses of Person
```typescript
const getSpouses = (personId: string): Person[] => {
  const spouseIds = relationships
    .filter(r => 
      r.type === 'spouse' && 
      (r.from_person_id === personId || r.to_person_id === personId)
    )
    .map(r => r.from_person_id === personId ? r.to_person_id : r.from_person_id)
  
  return persons.filter(p => spouseIds.includes(p.id))
}
```

### Check if Two People are Spouses
```typescript
const areSpouses = (person1Id: string, person2Id: string): boolean => {
  return relationships.some(r => 
    r.type === 'spouse' &&
    ((r.from_person_id === person1Id && r.to_person_id === person2Id) ||
     (r.from_person_id === person2Id && r.to_person_id === person1Id))
  )
}
```

### Count Spouse Relationships
```typescript
const countSpouses = (personId: string): number => {
  return relationships.filter(r => 
    r.type === 'spouse' && 
    (r.from_person_id === personId || r.to_person_id === personId)
  ).length
}
```

---

**Created**: January 28, 2026
**Usage**: Copy and modify these examples for your needs
