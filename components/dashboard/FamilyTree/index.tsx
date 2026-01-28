'use client'

import React, { useCallback, useMemo, useState } from 'react'
import {
  Connection,
  addEdge,
  Node,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow'
import {
  useRelationships,
  useCreateRelationship,
  useDeletePerson,
  useDeleteRelationship,
} from '@/lib/supabase/queries'
import { useUIStore } from '@/providers/ui-store-provider'
import type { Database } from '@/types/database.types'
import { PersonWithPhoto } from '@/types/app'
import { useFamilyTreeLayout } from './hooks/useFamilyTreeLayout'
import { useFamilyTreeExport } from './hooks/useFamilyTreeExport'
import { useFamilyTreeImport } from './hooks/useFamilyTreeImport'
import { usePositionManagement } from './hooks/usePositionManagement'
import { FamilyTreeCanvas } from './FamilyTreeCanvas'
import { FamilyTreeControls } from './FamilyTreeControls'
import { getLayoutedElements, updateSharedChildEdges } from './utils/dagre-layout'
import { toast } from 'sonner'
import 'reactflow/dist/style.css'

type Relationship = Database['public']['Tables']['relationships']['Row']

interface FamilyTreeProps {
  userId: string
  persons: PersonWithPhoto[]
  readOnly?: boolean
  relationships?: Relationship[]
}

const EMPTY_RELATIONSHIPS: Relationship[] = []

export function FamilyTree({ 
  userId, 
  persons, 
  relationships: initialRelationships, 
  readOnly = false 
}: FamilyTreeProps) {
  // Data fetching
  const { data: relationshipsData } = useRelationships(userId, {
    enabled: !readOnly,
  })
  const relationships = initialRelationships || relationshipsData || EMPTY_RELATIONSHIPS

  // UI state
  const openPersonModal = useUIStore((state) => state.openPersonModal)
  const { mutate: createRelationship } = useCreateRelationship()
  const { mutateAsync: deletePerson } = useDeletePerson()
  const { mutateAsync: deleteRelationship } = useDeleteRelationship()
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)

  // Custom hooks
  const { nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange } = useFamilyTreeLayout({
    persons,
    relationships,
  })

  const { onExport, onExportGedcom, onExportJson } = useFamilyTreeExport({
    persons,
    relationships,
    nodes,
    rfInstance,
    userId,
  })

  const {
    fileInputRef,
    jsonFileInputRef,
    handleImportGedcom,
    handleImportJson,
    triggerImport,
    triggerImportJson,
  } = useFamilyTreeImport({ userId })

  const {
    saveNodePosition,
    batchSavePositions,
  } = usePositionManagement({ readOnly, userId })

  // Handlers
  const refreshSharedChildEdges = useCallback(
    (movedNode: Node) => {
      const updatedNodes = nodes.map((node) =>
        node.id === movedNode.id ? { ...node, position: movedNode.position } : node
      )
      setEdges((currentEdges) => updateSharedChildEdges(updatedNodes, currentEdges))
    },
    [nodes, setEdges]
  )

  const onNodeDrag = useCallback(
    (_: any, node: Node) => {
      if (readOnly) return
      saveNodePosition(node.id, node.position.x, node.position.y)
      refreshSharedChildEdges(node)
    },
    [saveNodePosition, readOnly, refreshSharedChildEdges]
  )

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (readOnly) return
      saveNodePosition(node.id, node.position.x, node.position.y)
      refreshSharedChildEdges(node)
    },
    [saveNodePosition, readOnly, refreshSharedChildEdges]
  )

  const handleAutoLayout = useCallback(async () => {
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(nodes, edges)
    setNodes(newNodes)
    setEdges(newEdges)

    try {
      await batchSavePositions(newNodes)
      toast.success('Layout saved')
    } catch (error) {
      console.error('Failed to save layout:', error)
      toast.error('Failed to save layout')
    }
  }, [nodes, edges, setNodes, setEdges, batchSavePositions])

  const handleDeletePersonFromNode = useCallback(
    async (personId: string) => {
      if (readOnly) return
      try {
        await deletePerson({ id: personId, userId })
        setEdges((eds) => eds.filter((edge) => edge.source !== personId && edge.target !== personId))
        setNodes((nds) => nds.filter((node) => node.id !== personId))
        toast.success('Person deleted')
      } catch (error) {
        console.error('Failed to delete person:', error)
        toast.error('Failed to delete person')
      }
    },
    [deletePerson, readOnly, setEdges, setNodes, userId]
  )

  const handleDeleteRelationshipFromEdge = useCallback(
    async (relationshipId: string) => {
      if (readOnly) return
      try {
        await deleteRelationship({ id: relationshipId, userId })
        setEdges((eds) => eds.filter((edge) => edge.id !== relationshipId))
        toast.success('Relationship deleted')
      } catch (error) {
        console.error('Failed to delete relationship:', error)
        toast.error('Failed to delete relationship')
      }
    },
    [deleteRelationship, readOnly, setEdges, userId]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return

      const isSpouseConnection =
        params.sourceHandle?.startsWith('spouse') ||
        params.targetHandle?.startsWith('spouse')
      const relationshipType = isSpouseConnection ? 'spouse' : 'parent'

      // Optimistic update
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: isSpouseConnection ? 'spouse' : 'relationship',
            animated: !isSpouseConnection,
            data: {
              relationshipType,
            },
          },
          eds
        )
      )

      // Persist to Supabase
      if (params.source && params.target) {
        createRelationship({
          user_id: userId,
          from_person_id: params.source,
          to_person_id: params.target,
          source_handle: params.sourceHandle ?? null,
          target_handle: params.targetHandle ?? null,
          type: relationshipType,
        })
      }
    },
    [setEdges, createRelationship, userId, readOnly]
  )

  const handleNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      if (readOnly) {
        onNodesChange(changes.filter((change) => change.type !== 'remove'))
        return
      }

      const removedIds = changes
        .filter((change) => change.type === 'remove')
        .map((change) => change.id)

      if (removedIds.length > 0) {
        removedIds.forEach(async (id) => {
          try {
            await deletePerson({ id, userId })
            toast.success('Person deleted')
          } catch (error) {
            console.error('Failed to delete person:', error)
            toast.error('Failed to delete person')
          }
        })
      }

      onNodesChange(changes)
    },
    [readOnly, onNodesChange, deletePerson, userId]
  )

  const handleEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      if (readOnly) {
        onEdgesChange(changes.filter((change) => change.type !== 'remove'))
        return
      }

      const removedIds = changes
        .filter((change) => change.type === 'remove')
        .map((change) => change.id)

      if (removedIds.length > 0) {
        removedIds.forEach(async (id) => {
          try {
            await deleteRelationship({ id, userId })
            toast.success('Relationship deleted')
          } catch (error) {
            console.error('Failed to delete relationship:', error)
            toast.error('Failed to delete relationship')
          }
        })
      }

      onEdgesChange(changes)
    },
    [readOnly, onEdgesChange, deleteRelationship, userId]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      openPersonModal(node.id)
    },
    [openPersonModal]
  )

  const nodesWithActions = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDelete: handleDeletePersonFromNode,
          readOnly,
        },
      })),
    [nodes, handleDeletePersonFromNode, readOnly]
  )

  const edgesWithActions = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        type: edge.data?.relationshipType === 'spouse' ? 'spouse' : 'relationship',
        data: {
          ...edge.data,
          onDelete: handleDeleteRelationshipFromEdge,
          readOnly,
        },
      })),
    [edges, handleDeleteRelationshipFromEdge, readOnly]
  )

  return (
    <>
      <FamilyTreeCanvas
        nodes={nodesWithActions}
        edges={edgesWithActions}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onInit={setRfInstance}
      >
        <FamilyTreeControls
          userId={userId}
          readOnly={readOnly}
          onAutoLayout={handleAutoLayout}
          onExport={onExport}
          onExportGedcom={onExportGedcom}
          onExportJson={onExportJson}
          onImportGedcom={triggerImport}
          onImportJson={triggerImportJson}
        />
      </FamilyTreeCanvas>

      {/* Hidden file inputs */}
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
    </>
  )
}
