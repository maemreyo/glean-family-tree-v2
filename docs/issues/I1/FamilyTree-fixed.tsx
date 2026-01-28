'use client'

import React, { useCallback, useMemo, useRef } from 'react'
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

  // ============================================
  // 🔥 FIX: Smart sync to prevent position reset
  // ============================================
  const prevPersonIdsRef = useRef<Set<string>>(new Set())
  const prevRelationshipIdsRef = useRef<Set<string>>(new Set())
  const isInitializedRef = useRef(false)

  React.useEffect(() => {
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
    
    // Check if there are actual structural changes (add/remove)
    const personsChanged = 
      currentPersonIds.size !== prevPersonIds.size ||
      ![...currentPersonIds].every(id => prevPersonIds.has(id))
    
    const relationshipsChanged =
      currentRelationshipIds.size !== prevRelationshipIds.size ||
      ![...currentRelationshipIds].every(id => prevRelationshipIds.has(id))
    
    // Only re-layout if there are structural changes
    if (personsChanged || relationshipsChanged) {
      const addedPersons = [...currentPersonIds].filter(id => !prevPersonIds.has(id))
      const removedPersons = [...prevPersonIds].filter(id => !currentPersonIds.has(id))
      
      console.log('🔄 Structural changes detected, updating layout', {
        personsChanged,
        relationshipsChanged,
        added: addedPersons,
        removed: removedPersons
      })
      
      // Preserve existing positions for unchanged nodes
      const currentPositions = new Map(nodes.map(node => [node.id, node.position]))
      
      const updatedNodes = layoutedNodes.map(node => ({
        ...node,
        // Keep existing position if node wasn't added/removed
        position: currentPositions.has(node.id) && !addedPersons.includes(node.id)
          ? currentPositions.get(node.id)!
          : node.position
      }))
      
      setNodes(updatedNodes)
      setEdges(layoutedEdges)
      
      // Update refs
      prevPersonIdsRef.current = currentPersonIds
      prevRelationshipIdsRef.current = currentRelationshipIds
    } else {
      // Only update node data (không thay đổi position)
      console.log('📝 Updating node data only (preserving positions)')
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
  }, [layoutedNodes, layoutedEdges, persons, relationships, nodes, setNodes, setEdges])

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_, node) => {
      if (readOnly) return

      console.log('💾 Saving position for node:', node.id, node.position)
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

  const onExportJson = useCallback(() => {
    const data = {
      persons,
      relationships,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'glean-family-tree-backup.json'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [persons, relationships])

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const jsonFileInputRef = React.useRef<HTMLInputElement>(null)
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
            const husbandId = fam.husbandId ? idMap.get(fam.husbandId) : null
            const wifeId = fam.wifeId ? idMap.get(fam.wifeId) : null
            
            // Spouse relationship
            if (husbandId && wifeId) {
                newRelationships.push({
                    id: crypto.randomUUID(),
                    user_id: userId,
                    parent_id: husbandId,
                    child_id: wifeId,
                    relationship_type: 'spouse',
                    created_at: new Date().toISOString()
                })
            }
            
            // Parent-child relationships
            const parentId = husbandId || wifeId
            if (parentId) {
                fam.childIds.forEach(childId => {
                    const mappedChildId = idMap.get(childId)
                    if (mappedChildId) {
                        newRelationships.push({
                            id: crypto.randomUUID(),
                            user_id: userId,
                            parent_id: parentId,
                            child_id: mappedChildId,
                            relationship_type: 'parent',
                            created_at: new Date().toISOString()
                        })
                    }
                })
            }
        })
        
        // 4. Insert to database
        if (newPersons.length > 0) {
            const { error: personsError } = await supabase
                .from('persons')
                .insert(newPersons)
            
            if (personsError) throw personsError
        }
        
        if (newRelationships.length > 0) {
            const { error: relationshipsError } = await supabase
                .from('relationships')
                .insert(newRelationships)
            
            if (relationshipsError) throw relationshipsError
        }
        
        toast.dismiss(loadingToast)
        toast.success(`Imported ${newPersons.length} persons and ${newRelationships.length} relationships`)
        
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    } catch (error: any) {
        toast.dismiss(loadingToast)
        toast.error('Import failed: ' + error.message)
    }
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmRestore = window.confirm(
      'This will replace your current persons, relationships, photos, and life events. Continue?'
    )
    if (!confirmRestore) {
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = ''
      return
    }

    const loadingToast = toast.loading('Restoring JSON backup...')

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data?.persons) || !Array.isArray(data?.relationships)) {
        throw new Error('Invalid backup file')
      }

      const personsData = Array.isArray(data.persons) ? data.persons : []
      const relationshipsData = Array.isArray(data.relationships) ? data.relationships : []
      const photosData = Array.isArray(data.person_photos) ? data.person_photos : []
      const eventsData = Array.isArray(data.life_events) ? data.life_events : []
      const now = new Date().toISOString()

      const personsPayload = personsData.map((person: any) => ({
        id: person.id,
        user_id: userId,
        name: person.name,
        gender: person.gender ?? null,
        date_of_birth: person.date_of_birth ?? null,
        is_deceased: person.is_deceased ?? null,
        date_of_death: person.date_of_death ?? null,
        nickname: person.nickname ?? null,
        birth_place: person.birth_place ?? null,
        death_place: person.death_place ?? null,
        occupation: person.occupation ?? null,
        biography: person.biography ?? null,
        notes: person.notes ?? null,
        position_x: person.position_x ?? null,
        position_y: person.position_y ?? null,
        family_id: person.family_id ?? null,
        is_visible_in_share: person.is_visible_in_share ?? true,
        created_at: person.created_at ?? now,
        updated_at: person.updated_at ?? now,
      }))

      const relationshipsPayload = relationshipsData.map((relationship: any) => ({
        id: relationship.id,
        user_id: userId,
        parent_id: relationship.parent_id,
        child_id: relationship.child_id,
        relationship_type: relationship.relationship_type,
        created_at: relationship.created_at ?? now,
      }))

      const photosPayload = photosData.map((photo: any) => ({
        id: photo.id,
        person_id: photo.person_id,
        url: photo.url,
        user_id: userId,
        is_profile_picture: photo.is_profile_picture ?? null,
        description: photo.description ?? null,
        created_at: photo.created_at ?? now,
      }))

      const eventsPayload = eventsData.map((event: any) => ({
        id: event.id,
        person_id: event.person_id,
        user_id: userId,
        title: event.title,
        event_type: event.event_type,
        date: event.date ?? null,
        description: event.description ?? null,
        location: event.location ?? null,
        created_at: event.created_at ?? now,
      }))

      const deleteRelationships = supabase.from('relationships').delete().eq('user_id', userId)
      const deleteEvents = supabase.from('life_events').delete().eq('user_id', userId)
      const deletePhotos = supabase.from('person_photos').delete().eq('user_id', userId)
      const deletePersons = supabase.from('persons').delete().eq('user_id', userId)

      const deleteResults = await Promise.all([
        deleteRelationships,
        deleteEvents,
        deletePhotos,
      ])

      for (const result of deleteResults) {
        if (result.error) throw result.error
      }

      const deletePersonsResult = await deletePersons
      if (deletePersonsResult.error) throw deletePersonsResult.error

      if (personsPayload.length > 0) {
        const { error } = await supabase.from('persons').insert(personsPayload)
        if (error) throw error
      }

      if (relationshipsPayload.length > 0) {
        const { error } = await supabase
          .from('relationships')
          .insert(relationshipsPayload)
        if (error) throw error
      }

      if (photosPayload.length > 0) {
        const { error } = await supabase.from('person_photos').insert(photosPayload)
        if (error) throw error
      }

      if (eventsPayload.length > 0) {
        const { error } = await supabase.from('life_events').insert(eventsPayload)
        if (error) throw error
      }

      toast.dismiss(loadingToast)
      toast.success('JSON backup restored')
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = ''
      window.location.reload()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toast.error('Restore Failed: ' + error.message)
    }
  }

  const triggerImport = () => {
    fileInputRef.current?.click()
  }

  const triggerImportJson = () => {
    jsonFileInputRef.current?.click()
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
              <DropdownMenuItem onClick={onExportJson}>
                <FileDown className="mr-2 h-4 w-4" />
                Export JSON Backup
              </DropdownMenuItem>
              <DropdownMenuItem onClick={triggerImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import GEDCOM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={triggerImportJson}>
                <Upload className="mr-2 h-4 w-4" />
                Import JSON Backup
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
      <input
        type="file"
        ref={jsonFileInputRef}
        onChange={handleImportJson}
        className="hidden"
        accept=".json"
      />
    </div>
  )
}
