'use client'

import React, { useCallback, useState } from 'react'
import { Connection, addEdge, Node, ReactFlowInstance } from 'reactflow'
import { useRelationships, useUpdatePerson } from '@/lib/supabase/queries'
import { useUIStore } from '@/providers/ui-store-provider'
import type { Database } from '@/types/database.types'
import { PersonWithPhoto } from '@/types/app'
import { useFamilyTreeLayout } from './hooks/useFamilyTreeLayout'
import { useFamilyTreeExport } from './hooks/useFamilyTreeExport'
import { useFamilyTreeImport } from './hooks/useFamilyTreeImport'
import { FamilyTreeCanvas } from './FamilyTreeCanvas'
import { FamilyTreeControls } from './FamilyTreeControls'
import { getLayoutedElements } from './utils/dagre-layout'
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
  const { mutate: updatePerson } = useUpdatePerson()
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

  // Handlers
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (readOnly) return
      updatePerson({
        id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
      })
    },
    [updatePerson, readOnly]
  )

  const handleAutoLayout = useCallback(() => {
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
  }, [nodes, edges, setNodes, updatePerson])

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
