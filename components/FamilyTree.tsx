'use client'

import React, { useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position,
  NodeDragHandler,
  Panel,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import { usePersons, useRelationships, useUpdatePerson } from '@/lib/supabase/queries'
import { useUIStore } from '@/providers/ui-store-provider'
import type { Database } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { RotateCw } from 'lucide-react'

type Person = Database['public']['Tables']['persons']['Row']
type Relationship = Database['public']['Tables']['relationships']['Row']

interface FamilyTreeProps {
  userId: string
  persons: Person[]
}

const nodeWidth = 172
const nodeHeight = 36

const EMPTY_RELATIONSHIPS: Relationship[] = []

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  // Filter out spouse edges for layout to avoid hierarchical enforcement
  edges.forEach((edge) => {
    const isSpouse = edge.data?.relationshipType === 'spouse'
    if (!isSpouse) {
      dagreGraph.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: newNodes, edges }
}

export function FamilyTree({ userId, persons }: FamilyTreeProps) {
  const { data: relationshipsData } = useRelationships(userId)
  const relationships = relationshipsData || EMPTY_RELATIONSHIPS
  const openPersonModal = useUIStore((state) => state.openPersonModal)
  const { mutate: updatePerson } = useUpdatePerson()

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
      data: { label: person.name },
      position: { x: person.position_x || 0, y: person.position_y || 0 },
      type: 'default',
    }))
  }, [persons])

  const initialEdges: Edge[] = useMemo(() => {
    return relationships.map((rel) => {
      const isSpouse = rel.relationship_type === 'spouse'
      return {
        id: rel.id,
        source: rel.parent_id,
        target: rel.child_id,
        type: isSpouse ? 'straight' : 'smoothstep',
        animated: !isSpouse,
        style: isSpouse ? { stroke: '#ec4899', strokeWidth: 2 } : undefined,
        markerEnd: isSpouse ? undefined : { type: MarkerType.ArrowClosed },
        data: { relationshipType: rel.relationship_type },
      }
    })
  }, [relationships])

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (hasSavedPositions) {
      return {
        nodes: initialNodes.map((node) => ({
          ...node,
          targetPosition: Position.Top,
          sourcePosition: Position.Bottom,
        })),
        edges: initialEdges,
      }
    }
    return getLayoutedElements(initialNodes, initialEdges)
  }, [initialNodes, initialEdges, hasSavedPositions])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_, node) => {
      updatePerson({
        id: node.id,
        updates: {
          position_x: node.position.x,
          position_y: node.position.y,
        },
      })
    },
    [updatePerson]
  )

  const handleAutoLayout = () => {
    const { nodes: newNodes } = getLayoutedElements(nodes, edges)
    setNodes(newNodes)

    // Save new positions
    newNodes.forEach((node) => {
      updatePerson({
        id: node.id,
        updates: {
          position_x: node.position.x,
          position_y: node.position.y,
        },
      })
    })
  }

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, type: 'smoothstep', animated: true }, eds)
      ),
    [setEdges]
  )
  
  // Update nodes when layoutedNodes changes (e.g. data fetch)
  React.useEffect(() => {
    console.log('Layout effect triggered', { 
      nodesCount: layoutedNodes.length, 
      edgesCount: layoutedEdges.length 
    })
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges])

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    openPersonModal(node.id)
  }

  return (
    <div className="h-full w-full rounded-lg border bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
        <Panel position="top-right">
          <Button onClick={handleAutoLayout} variant="outline" size="sm" className="gap-2">
            <RotateCw className="h-4 w-4" />
            Auto Layout
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  )
}
