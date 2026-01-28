'use client'

import React, { useCallback, useState } from 'react'
import { Connection, addEdge, Node, ReactFlowInstance } from 'reactflow'
import { useRelationships } from '@/lib/supabase/queries'
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
  } = usePositionManagement({ readOnly })

  // Handlers with optimistic updates
  const onNodeDrag = useCallback(
    (_: any, node: Node) => {
      if (readOnly) return
      
      // Optimistic UI update (already handled by ReactFlow)
      // Debounced DB save
      saveNodePosition(node.id, node.position.x, node.position.y)
    },
    [saveNodePosition, readOnly]
  )

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (readOnly) return
      
      // Final position is already in node from onNodeDrag
      // Just ensure the debounced save happens
      saveNodePosition(node.id, node.position.x, node.position.y)
    },
    [saveNodePosition, readOnly]
  )

  const handleAutoLayout = useCallback(async () => {
    const { nodes: newNodes } = getLayoutedElements(nodes, edges)
    
    // Optimistic UI update
    setNodes(newNodes)

    // Batch save positions to DB
    try {
      await batchSavePositions(newNodes)
      toast.success('Layout saved')
    } catch (error) {
      console.error('Failed to save layout:', error)
      toast.error('Failed to save layout')
      // Optionally revert UI on error
    }
  }, [nodes, edges, setNodes, batchSavePositions])

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, type: 'smoothstep', animated: true }, eds)
      ),
    [setEdges]
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
