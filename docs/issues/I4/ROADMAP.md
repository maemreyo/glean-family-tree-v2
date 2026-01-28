# Family Tree Enhancement Roadmap

## Overview
Phát triển Family Tree thành công cụ genealogy chuyên nghiệp với performance tối ưu, UX xuất sắc, và tính năng phân tích mạnh mẽ.

---

## Phase 1: Performance & Core UX (4-6 weeks)

### 1.1 Virtual Rendering
**Mục tiêu**: Handle 500+ nodes mượt mà

**Technical approach**:
- Sử dụng React Flow's viewport-based rendering
- Implement virtualization cho nodes ngoài viewport
- LOD (Level of Detail): simplified nodes when zoomed out

**Implementation**:
```typescript
// hooks/useVirtualNodes.ts
export function useVirtualNodes(allNodes: Node[], viewport: Viewport) {
  return useMemo(() => {
    const visibleBounds = getViewportBounds(viewport)
    return allNodes.filter(node => isInViewport(node, visibleBounds))
  }, [allNodes, viewport])
}
```

**Metrics**:
- Target: 60fps với 1000+ nodes
- Memory: <200MB cho 5000 nodes

**Priority**: High
**Effort**: 5 days
**Dependencies**: None

---

### 1.2 Keyboard Shortcuts
**Shortcuts**:
- `Space` + drag: Pan canvas
- `Ctrl/Cmd + F`: Focus search
- `Ctrl/Cmd + Z`: Undo layout
- `Ctrl/Cmd + Shift + Z`: Redo layout
- `Escape`: Clear selection
- `Delete`: Delete selected node
- `Ctrl/Cmd + +/-`: Zoom in/out
- `Ctrl/Cmd + 0`: Fit view

**Implementation**:
```typescript
// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts(callbacks: ShortcutCallbacks) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        callbacks.undo()
      }
      // ... other shortcuts
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [callbacks])
}
```

**UX additions**:
- Shortcut cheatsheet modal (`?` key)
- Visual indicator khi shortcut active

**Priority**: High
**Effort**: 3 days
**Dependencies**: None

---

### 1.3 Enhanced Mini-map
**Features**:
- Click to jump to location
- Drag to pan main canvas
- Highlight current viewport
- Show node density heatmap

**Implementation**:
```typescript
// components/EnhancedMiniMap.tsx
<MiniMap
  nodeColor={(node) => getNodeDensityColor(node)}
  onClick={(e, position) => {
    rfInstance.setCenter(position.x, position.y, { zoom: 1, duration: 800 })
  }}
  onMouseDown={(e) => {
    // Enable drag-to-pan
    startMiniMapDrag(e)
  }}
/>
```

**Priority**: Medium
**Effort**: 2 days
**Dependencies**: None

---

### 1.4 Loading States
**Components to add**:
- Skeleton nodes during initial load
- Progressive rendering (show closest relatives first)
- Loading indicator cho import/export
- Shimmer effect cho loading photos

**Implementation**:
```typescript
// components/NodeSkeleton.tsx
export function NodeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 w-48 bg-gray-200 rounded-lg" />
    </div>
  )
}

// Progressive loading
const { data: persons, isLoading } = usePersons(userId)
const visiblePersons = isLoading 
  ? generateSkeletonData(10) 
  : persons
```

**Priority**: Medium
**Effort**: 2 days
**Dependencies**: None

---

## Phase 2: Advanced Features (6-8 weeks)

### 2.1 Multiple Layout Algorithms

#### Hierarchical (Current - Enhance)
- Top-down/bottom-up toggle
- Left-to-right option
- Sibling spacing control

#### Force-Directed Layout
**Use case**: Organic, relationship-focused view

```typescript
// utils/layouts/force-directed.ts
import * as d3 from 'd3-force'

export function forceDirectedLayout(nodes: Node[], edges: Edge[]) {
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width/2, height/2))
  
  simulation.tick(300) // Pre-calculate
  return simulation.nodes()
}
```

#### Radial Layout
**Use case**: Ancestor-centric, generational rings

```typescript
// utils/layouts/radial.ts
export function radialLayout(nodes: Node[], rootId: string) {
  const generations = calculateGenerations(nodes, rootId)
  return nodes.map(node => ({
    ...node,
    position: {
      x: Math.cos(node.angle) * (generation * 150),
      y: Math.sin(node.angle) * (generation * 150)
    }
  }))
}
```

#### Timeline Layout
**Use case**: Chronological view

```typescript
// utils/layouts/timeline.ts
export function timelineLayout(nodes: Node[]) {
  const sorted = sortByBirthYear(nodes)
  return sorted.map((node, i) => ({
    ...node,
    position: {
      x: i * 250,
      y: calculateYearPosition(node.date_of_birth)
    }
  }))
}
```

**UI Component**:
```typescript
// components/LayoutSwitcher.tsx
<Select value={layout} onValueChange={setLayout}>
  <SelectItem value="hierarchical">Hierarchical</SelectItem>
  <SelectItem value="force">Force-Directed</SelectItem>
  <SelectItem value="radial">Radial</SelectItem>
  <SelectItem value="timeline">Timeline</SelectItem>
</Select>
```

**Priority**: High
**Effort**: 10 days
**Dependencies**: None

---

### 2.2 Visual Filtering

**Filter options**:
```typescript
interface FilterState {
  generations?: { min: number; max: number }
  birthYears?: { min: number; max: number }
  locations?: string[]
  showDeceased?: boolean
  genders?: ('male' | 'female' | 'other')[]
  hasPhotos?: boolean
}
```

**Implementation**:
```typescript
// hooks/useTreeFilters.ts
export function useTreeFilters(persons: Person[], filters: FilterState) {
  return useMemo(() => {
    return persons.filter(person => {
      if (filters.generations) {
        const gen = calculateGeneration(person)
        if (gen < filters.generations.min || gen > filters.generations.max) {
          return false
        }
      }
      
      if (filters.birthYears && person.date_of_birth) {
        const year = new Date(person.date_of_birth).getFullYear()
        if (year < filters.birthYears.min || year > filters.birthYears.max) {
          return false
        }
      }
      
      if (filters.locations?.length) {
        if (!filters.locations.includes(person.birth_place)) {
          return false
        }
      }
      
      if (filters.showDeceased === false && person.is_deceased) {
        return false
      }
      
      return true
    })
  }, [persons, filters])
}
```

**UI Component**:
```typescript
// components/FilterPanel.tsx
<Sheet>
  <SheetTrigger>
    <Button><Filter /> Filters</Button>
  </SheetTrigger>
  <SheetContent>
    <div className="space-y-4">
      <GenerationFilter value={filters.generations} onChange={...} />
      <YearRangeFilter value={filters.birthYears} onChange={...} />
      <LocationFilter value={filters.locations} onChange={...} />
      <DeceasedToggle value={filters.showDeceased} onChange={...} />
    </div>
  </SheetContent>
</Sheet>
```

**Priority**: High
**Effort**: 8 days
**Dependencies**: None

---

### 2.3 Smart Grouping

#### Auto-collapse Distant Relatives
```typescript
// utils/grouping/auto-collapse.ts
export function autoCollapse(nodes: Node[], rootId: string) {
  const distances = calculateDistances(nodes, rootId)
  return nodes.map(node => ({
    ...node,
    collapsed: distances[node.id] > 3 // Collapse beyond 3rd degree
  }))
}
```

#### Family Group Boxes
```typescript
// components/FamilyGroupBox.tsx
export function FamilyGroupBox({ members }: { members: Person[] }) {
  const bounds = calculateBounds(members)
  return (
    <div 
      className="absolute border-2 border-blue-200 rounded-lg bg-blue-50/20"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height
      }}
    >
      <span className="text-xs font-medium">{members[0].family_name}</span>
    </div>
  )
}
```

#### Sibling Stacking
```typescript
// utils/layouts/sibling-stack.ts
export function stackSiblings(nodes: Node[], relationships: Relationship[]) {
  const siblings = groupSiblings(nodes, relationships)
  
  return siblings.map(siblingGroup => {
    if (siblingGroup.length <= 3) return siblingGroup // Don't stack
    
    return {
      ...siblingGroup[0],
      data: {
        ...siblingGroup[0].data,
        stackedSiblings: siblingGroup.slice(1),
        stackCount: siblingGroup.length
      }
    }
  })
}
```

**Priority**: Medium
**Effort**: 7 days
**Dependencies**: 2.1 (Layout algorithms)

---

### 2.4 Rich Node Interactions

#### Hover Preview
```typescript
// components/NodeHoverCard.tsx
<HoverCard>
  <HoverCardTrigger>{node}</HoverCardTrigger>
  <HoverCardContent>
    <div className="space-y-2">
      <Avatar size="lg" src={node.profilePhoto} />
      <h3>{node.name}</h3>
      <p className="text-sm">
        {formatDateRange(node.date_of_birth, node.date_of_death)}
      </p>
      {node.occupation && <Badge>{node.occupation}</Badge>}
      <p className="text-xs line-clamp-3">{node.biography}</p>
    </div>
  </HoverCardContent>
</HoverCard>
```

#### Context Menu
```typescript
// components/NodeContextMenu.tsx
<ContextMenu>
  <ContextMenuTrigger>{node}</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={() => onEdit(node)}>
      <Edit /> Edit
    </ContextMenuItem>
    <ContextMenuItem onSelect={() => onAddRelative(node)}>
      <Plus /> Add Relative
    </ContextMenuItem>
    <ContextMenuItem onSelect={() => onFocus(node)}>
      <Target /> Focus on This Person
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem onSelect={() => onDelete(node)} className="text-red-600">
      <Trash /> Delete
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

#### Double-click to Focus
```typescript
const onNodeDoubleClick = useCallback((e: React.MouseEvent, node: Node) => {
  // Center on node with zoom
  rfInstance.setCenter(node.position.x, node.position.y, { 
    zoom: 1.5, 
    duration: 500 
  })
  
  // Highlight direct relatives
  const relatedIds = getDirectRelatives(node.id, relationships)
  setHighlightedNodes(relatedIds)
}, [rfInstance, relationships])
```

#### Color Coding
```typescript
// utils/color-coding.ts
export function getNodeColor(person: Person, colorScheme: ColorScheme) {
  switch (colorScheme) {
    case 'family-line':
      return getFamilyLineColor(person.family_id)
    case 'generation':
      return getGenerationColor(calculateGeneration(person))
    case 'gender':
      return person.gender === 'male' ? '#3b82f6' : '#ec4899'
    case 'deceased':
      return person.is_deceased ? '#6b7280' : '#10b981'
    default:
      return '#ffffff'
  }
}
```

**Priority**: High
**Effort**: 9 days
**Dependencies**: None

---

## Phase 3: Data Intelligence (4-6 weeks)

### 3.1 Auto-detect Relationships
```typescript
// utils/inference/relationship-detector.ts
export function detectRelationships(persons: Person[]): SuggestedRelationship[] {
  const suggestions: SuggestedRelationship[] = []
  
  // Same last name + age gap = likely parent-child
  persons.forEach(p1 => {
    persons.forEach(p2 => {
      if (p1.name.split(' ').pop() === p2.name.split(' ').pop()) {
        const ageGap = calculateAgeGap(p1, p2)
        if (ageGap > 15 && ageGap < 50) {
          suggestions.push({
            parent: ageGap > 0 ? p1 : p2,
            child: ageGap > 0 ? p2 : p1,
            confidence: 0.7,
            reason: 'Same surname with appropriate age gap'
          })
        }
      }
    })
  })
  
  return suggestions
}
```

### 3.2 Duplicate Detection
```typescript
// utils/inference/duplicate-detector.ts
export function detectDuplicates(persons: Person[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = []
  
  persons.forEach(p1 => {
    persons.forEach(p2 => {
      if (p1.id === p2.id) return
      
      const similarity = calculateSimilarity(p1, p2)
      if (similarity > 0.8) {
        pairs.push({
          person1: p1,
          person2: p2,
          similarity,
          matchingFields: getMatchingFields(p1, p2)
        })
      }
    })
  })
  
  return pairs
}

function calculateSimilarity(p1: Person, p2: Person): number {
  let score = 0
  let fields = 0
  
  if (p1.name && p2.name) {
    fields++
    score += stringSimilarity(p1.name, p2.name)
  }
  
  if (p1.date_of_birth && p2.date_of_birth) {
    fields++
    score += dateSimilarity(p1.date_of_birth, p2.date_of_birth)
  }
  
  return score / fields
}
```

### 3.3 Data Validation
```typescript
// utils/validation/data-validator.ts
export function validatePersonData(person: Person, relationships: Relationship[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  // Birth after death
  if (person.date_of_birth && person.date_of_death) {
    if (new Date(person.date_of_birth) > new Date(person.date_of_death)) {
      issues.push({
        severity: 'error',
        field: 'date_of_birth',
        message: 'Birth date is after death date'
      })
    }
  }
  
  // Parent-child age gap
  const children = getChildren(person.id, relationships)
  children.forEach(child => {
    const ageGap = calculateAgeGap(person, child)
    if (ageGap < 13) {
      issues.push({
        severity: 'warning',
        field: 'relationships',
        message: `Parent-child age gap with ${child.name} is suspiciously small (${ageGap} years)`
      })
    }
  })
  
  return issues
}
```

### 3.4 Statistics Panel
```typescript
// components/StatisticsPanel.tsx
export function StatisticsPanel({ persons, relationships }: Props) {
  const stats = useMemo(() => ({
    totalPersons: persons.length,
    totalRelationships: relationships.length,
    generations: calculateGenerations(persons),
    oldestPerson: getOldestPerson(persons),
    youngestPerson: getYoungestPerson(persons),
    averageLifespan: calculateAverageLifespan(persons),
    largestFamily: getLargestFamily(persons, relationships),
    birthYearRange: getBirthYearRange(persons),
    mostCommonLocations: getMostCommonLocations(persons),
    genderDistribution: getGenderDistribution(persons),
  }), [persons, relationships])
  
  return (
    <Sheet>
      <SheetTrigger>
        <Button><BarChart /> Statistics</Button>
      </SheetTrigger>
      <SheetContent>
        <div className="space-y-4">
          <StatCard label="Total Persons" value={stats.totalPersons} />
          <StatCard label="Generations" value={stats.generations} />
          <StatCard label="Average Lifespan" value={`${stats.averageLifespan} years`} />
          <ChartCard title="Gender Distribution" data={stats.genderDistribution} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

**Priority**: Medium
**Effort**: 15 days total
**Dependencies**: None

---

## Implementation Timeline

### Sprint 1-2 (Weeks 1-4): Core Performance
- Virtual rendering
- Keyboard shortcuts
- Enhanced mini-map
- Loading states

### Sprint 3-4 (Weeks 5-8): Layout & Filtering
- Multiple layout algorithms
- Visual filtering system
- Layout switcher UI

### Sprint 5-6 (Weeks 9-12): Interactions & Grouping
- Rich node interactions
- Smart grouping
- Context menus
- Hover previews

### Sprint 7-8 (Weeks 13-16): Intelligence
- Auto-detect relationships
- Duplicate detection
- Data validation
- Statistics panel

---

## Technical Stack Additions

### New Dependencies
```json
{
  "d3-force": "^3.0.0",           // Force-directed layout
  "d3-hierarchy": "^3.1.2",        // Radial layout
  "fuse.js": "^7.0.0",            // Fuzzy search
  "react-hotkeys-hook": "^4.4.1", // Keyboard shortcuts
  "recharts": "^2.10.0"           // Statistics charts
}
```

### New Database Schema
```sql
-- Suggestions table for auto-detected relationships
CREATE TABLE relationship_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  parent_id UUID REFERENCES persons(id),
  child_id UUID REFERENCES persons(id),
  confidence FLOAT,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT NOW()
);

-- Validation issues
CREATE TABLE validation_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES persons(id),
  severity TEXT, -- error, warning, info
  field TEXT,
  message TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Success Metrics

### Performance
- [ ] 60fps with 1000+ nodes
- [ ] <100ms filter response time
- [ ] <2s initial load time

### User Engagement
- [ ] 50% of users try multiple layouts
- [ ] 30% use keyboard shortcuts regularly
- [ ] 80% hover on nodes before clicking

### Data Quality
- [ ] 90% of suggestions accepted
- [ ] 70% of duplicates merged
- [ ] <5% validation errors on mature trees

---

## Risk Mitigation

### Performance Risks
- **Risk**: Virtual rendering breaks with complex layouts
- **Mitigation**: Fallback to pagination for >2000 nodes

### UX Risks
- **Risk**: Too many features overwhelm users
- **Mitigation**: Progressive disclosure, feature tours

### Data Risks
- **Risk**: Auto-detection creates wrong relationships
- **Mitigation**: All suggestions require manual approval

---

## Future Considerations (Post-Roadmap)

- AI-powered photo face matching
- DNA integration (23andMe, AncestryDNA)
- Historical records integration
- Mobile app with offline sync
- Collaborative editing with conflict resolution
- Advanced privacy controls (GDPR compliance)
- Document scanning & OCR
- Story/narrative timeline view

---

## Getting Started

1. **Phase 1 Week 1**: Start with virtual rendering (highest impact)
2. **Get feedback**: Deploy to staging, gather user input
3. **Iterate**: Adjust priorities based on usage data
4. **Document**: Update this roadmap quarterly

---

**Last Updated**: January 2026
**Next Review**: April 2026
