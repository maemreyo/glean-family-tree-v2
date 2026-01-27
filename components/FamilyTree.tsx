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
  ReactFlowInstance,
  getRectOfNodes,
  getTransformForBounds,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import { toPng } from 'html-to-image'
import { usePersons, useRelationships, useUpdatePerson } from '@/lib/supabase/queries'
import { useUIStore } from '@/providers/ui-store-provider'
import type { Database } from '@/types/database.types'
import { PersonWithPhoto } from '@/types/app'
import { Button } from '@/components/ui/button'
import { RotateCw, FileDown, Image as ImageIcon, FileText, Upload } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { generateGedcom, parseGedcom, parseGedcomDate } from "@/lib/gedcom"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { PersonNode } from './PersonNode'
import { ShareDialog } from './ShareDialog'

type Relationship = Database['public']['Tables']['relationships']['Row']

interface FamilyTreeProps {
  userId: string
  persons: PersonWithPhoto[]
  readOnly?: boolean
}

const nodeWidth = 200
const nodeHeight = 50

const nodeTypes = {
  person: PersonNode,
}

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

export function FamilyTree({ userId, persons, relationships: initialRelationships, readOnly = false }: FamilyTreeProps & { relationships?: Relationship[] }) {
  const { data: relationshipsData } = useRelationships(userId, {
    enabled: !readOnly,
  })
  const relationships = initialRelationships || relationshipsData || EMPTY_RELATIONSHIPS
  const openPersonModal = useUIStore((state) => state.openPersonModal)
  const { mutate: updatePerson } = useUpdatePerson()
  const [rfInstance, setRfInstance] = React.useState<ReactFlowInstance | null>(null)

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
      if (readOnly) return

      updatePerson({
        id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
      })
    },
    [updatePerson, readOnly]
  )

  const onExport = useCallback(() => {
    if (!rfInstance) return

    const nodesBounds = getRectOfNodes(nodes)
    const transform = getTransformForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
      2
    )

    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!viewport) return

    toPng(viewport, {
      backgroundColor: '#fff',
      width: nodesBounds.width,
      height: nodesBounds.height,
      style: {
        width: `${nodesBounds.width}px`,
        height: `${nodesBounds.height}px`,
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    }).then((dataUrl) => {
      const link = document.createElement('a')
      link.download = 'glean-family-tree.png'
      link.href = dataUrl
      link.click()
    })
  }, [rfInstance, nodes])

  const onExportGedcom = useCallback(() => {
    const gedcomContent = generateGedcom(persons, relationships)
    const blob = new Blob([gedcomContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'glean-family-tree.ged'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [persons, relationships])

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleImportGedcom = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const loadingToast = toast.loading('Importing GEDCOM...')
    
    try {
        const text = await file.text()
        const { persons: gedPersons, families: gedFamilies } = parseGedcom(text)
        
        // 1. Map IDs
        const idMap = new Map<string, string>()
        
        // 2. Persons
        const newPersons = gedPersons.map(p => {
            const uuid = crypto.randomUUID()
            idMap.set(p.id, uuid)
            return {
                id: uuid,
                user_id: userId,
                name: p.name || 'Unknown',
                gender: p.gender || 'other',
                birth_place: p.birthPlace,
                death_place: p.deathPlace,
                occupation: p.occupation,
                notes: p.notes,
                date_of_birth: parseGedcomDate(p.birthDate),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        })
        
        // 3. Relationships
        const newRelationships: any[] = []
        gedFamilies.forEach(fam => {
            const husbId = fam.husb ? idMap.get(fam.husb) : null
            const wifeId = fam.wife ? idMap.get(fam.wife) : null
            
            if (husbId && wifeId) {
                newRelationships.push({
                    parent_id: husbId,
                    child_id: wifeId,
                    relationship_type: 'spouse'
                })
            }
            
            fam.children.forEach(childGedId => {
                const childId = idMap.get(childGedId)
                if (childId) {
                    if (husbId) newRelationships.push({ parent_id: husbId, child_id: childId, relationship_type: 'parent-child' })
                    if (wifeId) newRelationships.push({ parent_id: wifeId, child_id: childId, relationship_type: 'parent-child' })
                }
            })
        })
        
        // 4. Insert
        const { error: pError } = await supabase.from('persons').insert(newPersons)
        if (pError) throw pError
        
        const { error: rError } = await supabase.from('relationships').insert(newRelationships)
        if (rError) throw rError
        
        toast.dismiss(loadingToast)
        toast.success(`Imported ${newPersons.length} persons and ${newRelationships.length} relationships.`)
        
        if (fileInputRef.current) fileInputRef.current.value = ''
        window.location.reload()
        
    } catch (error: any) {
        toast.dismiss(loadingToast)
        toast.error('Import Failed: ' + error.message)
    }
  }

  const triggerImport = () => {
    fileInputRef.current?.click()
  }

  const handleAutoLayout = () => {
    const { nodes: newNodes } = getLayoutedElements(nodes, edges)
    setNodes(newNodes)

    // Save new positions
    newNodes.forEach((node) => {
      updatePerson({
        id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
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
        onNodeDragStop={onNodeDragStop}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
        <Panel position="top-right" className="flex gap-2">
          {!readOnly && <ShareDialog userId={userId} />}
          <Button onClick={handleAutoLayout} variant="outline" size="sm" className="gap-2">
            <RotateCw className="h-4 w-4" />
            Auto Layout
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileDown className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExport}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Export as Image (PNG)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportGedcom}>
                <FileText className="mr-2 h-4 w-4" />
                Export GEDCOM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={triggerImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import GEDCOM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Panel>
      </ReactFlow>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportGedcom}
        className="hidden"
        accept=".ged,.gedcom"
      />
    </div>
  )
}
