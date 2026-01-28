import { useMemo, useRef, useEffect } from 'react'
import { useNodesState, useEdgesState, Node, Edge, Position, MarkerType } from 'reactflow'
import { PersonWithPhoto } from '@/types/app'
import { Database } from '@/types/database.types'
import { getLayoutedElements, syncSpouseData } from '../utils/dagre-layout'

type Relationship = Database['public']['Tables']['relationships']['Row']

interface UseFamilyTreeLayoutProps {
  persons: PersonWithPhoto[]
  relationships: Relationship[]
}

export function useFamilyTreeLayout({ persons, relationships }: UseFamilyTreeLayoutProps) {
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
    }))
  }, [persons])

  const initialEdges: Edge[] = useMemo(() => {
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
        style: isSpouse ? { stroke: '#ec4899', strokeWidth: 2 } : undefined,
        markerEnd: isSpouse ? undefined : { type: MarkerType.ArrowClosed },
        data: { relationshipType: rel.type },
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
      return syncSpouseData(savedNodes, initialEdges)
    }
    return getLayoutedElements(initialNodes, initialEdges)
  }, [initialNodes, initialEdges, hasSavedPositions])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // Smart sync to prevent position reset
  const prevPersonIdsRef = useRef<Set<string>>(new Set())
  const prevRelationshipIdsRef = useRef<Set<string>>(new Set())
  const isInitializedRef = useRef(false)

  useEffect(() => {
    const currentPersonIds = new Set(persons.map(p => p.id))
    const currentRelationshipIds = new Set(relationships.map(r => r.id))
    
    const prevPersonIds = prevPersonIdsRef.current
    const prevRelationshipIds = prevRelationshipIdsRef.current
    
    // First initialization
    if (!isInitializedRef.current) {
      console.log('🎬 Initial layout setup')
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      prevPersonIdsRef.current = currentPersonIds
      prevRelationshipIdsRef.current = currentRelationshipIds
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
    
    if (personsChanged || relationshipsChanged) {
      const addedPersons = Array.from(currentPersonIds).filter(id => !prevPersonIds.has(id))
      // const removedPersons = Array.from(prevPersonIds).filter(id => !currentPersonIds.has(id))
      
      console.log('🔄 Structural changes detected')
      
      // Preserve existing positions for unchanged nodes
      const currentPositions = new Map(nodes.map(node => [node.id, node.position]))
      
      const updatedNodes = layoutedNodes.map(node => ({
        ...node,
        position: currentPositions.has(node.id) && !addedPersons.includes(node.id)
          ? currentPositions.get(node.id)!
          : node.position
      }))
      
      setNodes(updatedNodes)
      setEdges(layoutedEdges)
      
      prevPersonIdsRef.current = currentPersonIds
      prevRelationshipIdsRef.current = currentRelationshipIds
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
  }, [layoutedNodes, layoutedEdges, persons, relationships, setNodes, setEdges])

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
  }
}
