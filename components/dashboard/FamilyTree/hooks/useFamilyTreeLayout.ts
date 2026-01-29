import { useMemo, useRef, useEffect } from 'react'
import { useNodesState, useEdgesState, Node, Edge, Position, MarkerType } from 'reactflow'
import { PersonWithPhoto } from '@/types/app'
import { Database } from '@/types/database.types'
import { getLayoutedElements, syncSpouseData } from '../utils/dagre-layout'

type Relationship = Database['public']['Tables']['relationships']['Row']

interface LayoutOptions {
  direction?: string
  nodeWidth?: number
  nodeHeight?: number
}

interface UseFamilyTreeLayoutProps {
  persons: PersonWithPhoto[]
  relationships: Relationship[]
  layoutOptions?: LayoutOptions
}

export function useFamilyTreeLayout({ persons, relationships, layoutOptions = {} }: UseFamilyTreeLayoutProps) {
  const hasSavedPositions = useMemo(() => {
    return persons.some(
      (p) =>
        (p.position_x !== null && p.position_x !== 0) ||
        (p.position_y !== null && p.position_y !== 0)
    )
  }, [persons])

  const initialNodes: Node[] = useMemo(() => {
    return persons.map((person) => ({
      id: person.id,
      data: { label: person.name, ...person },
      position: { x: person.position_x || 0, y: person.position_y || 0 },
      type: 'person',
      width: layoutOptions.nodeWidth,
      height: layoutOptions.nodeHeight,
    }))
  }, [persons, layoutOptions.nodeWidth, layoutOptions.nodeHeight])

  const initialEdges: Edge[] = useMemo(() => {
    const spousePairs = new Set<string>()
    const childParents = new Map<string, Map<string, string>>()

    relationships.forEach((rel) => {
      if (rel.type === 'spouse') {
        const pairKey = [rel.from_person_id, rel.to_person_id].sort().join('|')
        spousePairs.add(pairKey)
      }
      if (rel.type === 'parent') {
        if (!childParents.has(rel.to_person_id)) {
          childParents.set(rel.to_person_id, new Map())
        }
        childParents.get(rel.to_person_id)!.set(rel.from_person_id, rel.id)
      }
    })

    const hiddenParentEdgeIds = new Set<string>()
    const sharedParentEdgeIds = new Set<string>()
    const spousePairByEdgeId = new Map<string, [string, string]>()

    childParents.forEach((parentMap) => {
      const parents = Array.from(parentMap.keys())
      for (let i = 0; i < parents.length; i += 1) {
        for (let j = i + 1; j < parents.length; j += 1) {
          const pairKey = [parents[i], parents[j]].sort().join('|')
          if (spousePairs.has(pairKey)) {
            const keepParent = parents[i] < parents[j] ? parents[i] : parents[j]
            const hideParent = keepParent === parents[i] ? parents[j] : parents[i]
            const edgeIdToHide = parentMap.get(hideParent)
            if (edgeIdToHide) hiddenParentEdgeIds.add(edgeIdToHide)
            const edgeIdToKeep = parentMap.get(keepParent)
            if (edgeIdToKeep) {
              sharedParentEdgeIds.add(edgeIdToKeep)
              spousePairByEdgeId.set(edgeIdToKeep, [parents[i], parents[j]].sort() as [string, string])
            }
          }
        }
      }
    })

    return relationships.map((rel) => {
      const isSpouse = rel.type === 'spouse'
      return {
        id: rel.id,
        source: rel.from_person_id,
        target: rel.to_person_id,
        sourceHandle: rel.source_handle ?? undefined,
        targetHandle: rel.target_handle ?? undefined,
        type: isSpouse ? 'straight' : 'smoothstep',
        animated: !isSpouse,
        style: isSpouse ? { stroke: 'var(--relationship-spouse)', strokeWidth: 2 } : undefined,
        markerEnd: isSpouse ? undefined : { type: MarkerType.ArrowClosed },
        data: {
          relationshipType: rel.type,
          hidden: hiddenParentEdgeIds.has(rel.id),
          sharedChild: sharedParentEdgeIds.has(rel.id),
          spousePair: spousePairByEdgeId.get(rel.id),
        },
      }
    })
  }, [relationships])

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (hasSavedPositions) {
      const savedNodes = initialNodes.map((node) => ({
        ...node,
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
      }))
      return syncSpouseData(savedNodes, initialEdges, layoutOptions)
    }
    return getLayoutedElements(initialNodes, initialEdges, layoutOptions)
  }, [initialNodes, initialEdges, hasSavedPositions, layoutOptions])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // Smart sync to prevent position reset
  const prevPersonIdsRef = useRef<Set<string>>(new Set())
  const prevRelationshipIdsRef = useRef<Set<string>>(new Set())
  const prevLayoutOptionsRef = useRef<string>('')
  const isInitializedRef = useRef(false)

  useEffect(() => {
    const currentPersonIds = new Set(persons.map(p => p.id))
    const currentRelationshipIds = new Set(relationships.map(r => r.id))
    const currentLayoutOptionsStr = JSON.stringify(layoutOptions)
    
    const prevPersonIds = prevPersonIdsRef.current
    const prevRelationshipIds = prevRelationshipIdsRef.current
    const prevLayoutOptions = prevLayoutOptionsRef.current
    
    // First initialization
    if (!isInitializedRef.current) {
      console.log('🎬 Initial layout setup')
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      prevPersonIdsRef.current = currentPersonIds
      prevRelationshipIdsRef.current = currentRelationshipIds
      prevLayoutOptionsRef.current = currentLayoutOptionsStr
      isInitializedRef.current = true
      return
    }
    
    // Check for structural changes
    const personsChanged = 
      currentPersonIds.size !== prevPersonIds.size ||
      !Array.from(currentPersonIds).every(id => prevPersonIds.has(id))
    
    const relationshipsChanged =
      currentRelationshipIds.size !== prevRelationshipIds.size ||
      !Array.from(currentRelationshipIds).every(id => prevRelationshipIds.has(id))

    const layoutChanged = currentLayoutOptionsStr !== prevLayoutOptions
    
    if (personsChanged || relationshipsChanged || layoutChanged) {
      console.log('🔄 Structural or layout changes detected')
      
      // If layout options changed, we should apply new layout positions
      if (layoutChanged) {
        setNodes(layoutedNodes)
      } else {
        // Preserve existing positions for unchanged nodes if only data/structure changed slightly
        // But if structure changed significantly (new nodes), we might want to respect dagre
        // For now keeping existing logic for structure changes
        const addedPersons = Array.from(currentPersonIds).filter(id => !prevPersonIds.has(id))
        const currentPositions = new Map(nodes.map(node => [node.id, node.position]))
        
        const updatedNodes = layoutedNodes.map(node => ({
          ...node,
          position: currentPositions.has(node.id) && !addedPersons.includes(node.id)
            ? currentPositions.get(node.id)!
            : node.position
        }))
        
        setNodes(updatedNodes)
      }

      setEdges(layoutedEdges)
      
      prevPersonIdsRef.current = currentPersonIds
      prevRelationshipIdsRef.current = currentRelationshipIds
      prevLayoutOptionsRef.current = currentLayoutOptionsStr
    } else {
      // Only update node data (preserve positions)
      console.log('📝 Updating node data only')
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
  }, [layoutedNodes, layoutedEdges, persons, relationships, setNodes, setEdges, layoutOptions])

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
  }
}
