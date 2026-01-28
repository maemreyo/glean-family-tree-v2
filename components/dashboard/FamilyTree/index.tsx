'use client'

import React, { useCallback, useState } from 'react'
import { Connection, addEdge, Node, ReactFlowInstance } from 'reactflow'
import { useRelationships, useUpdatePerson, useCreateRelationship } from '@/lib/supabase/queries'
import { useUIStore } from '@/providers/ui-store-provider'
import type { Database } from '@/types/database.types'
import { PersonWithPhoto } from '@/types/app'
import { useFamilyTreeLayout } from './hooks/useFamilyTreeLayout'
import { useFamilyTreeExport } from './hooks/useFamilyTreeExport'
import { useFamilyTreeImport } from './hooks/useFamilyTreeImport'
import { usePositionManagement } from './hooks/usePositionManagement'
import { FamilyTreeCanvas } from './FamilyTreeCanvas'
import { FamilyTreeControls } from './FamilyTreeControls'
import { getLayoutedElements } from './utils/dagre-layout'
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
  const onNodeDrag = useCallback(
    (_: any, node: Node) => {
      if (readOnly) return
      saveNodePosition(node.id, node.position.x, node.position.y)
    },
    [saveNodePosition, readOnly]
  )

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (readOnly) return
      saveNodePosition(node.id, node.position.x, node.position.y)
    },
    [saveNodePosition, readOnly]
  )

  const handleAutoLayout = useCallback(async () => {
    const { nodes: newNodes } = getLayoutedElements(nodes, edges)
    setNodes(newNodes)

    try {
      await batchSavePositions(newNodes)
      toast.success('Layout saved')
    } catch (error) {
      console.error('Failed to save layout:', error)
      toast.error('Failed to save layout')
    }
  }, [nodes, edges, setNodes, batchSavePositions])

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return

      // Optimistic update
      setEdges((eds) =>
        addEdge({ ...params, type: 'smoothstep', animated: true }, eds)
      )

      // Persist to Supabase
      if (params.source && params.target) {
        createRelationship({
          user_id: userId,
          from_person_id: params.source,
          to_person_id: params.target,
          type: 'parent', // Default to parent
        })
      }
    },
    [setEdges, createRelationship, userId, readOnly]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      openPersonModal(node.id)
    },
    [openPersonModal]
  )

  return (
    <>
      <FamilyTreeCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
