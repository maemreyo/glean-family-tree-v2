'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
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
  useCreatePerson,
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
import { useTreeFilters } from './hooks/useTreeFilters'
import { useFamilyTreeHistory } from './hooks/useFamilyTreeHistory'
import { useNodeDragging } from './hooks/useNodeDragging'
import { useFamilyTreeShortcuts } from './hooks/useFamilyTreeShortcuts'
import { useFamilyTreeContextMenu } from './hooks/useFamilyTreeContextMenu'
import { FamilyTreeCanvas } from './FamilyTreeCanvas'
import { FamilyTreeControls } from './FamilyTreeControls'
import { NodeContextMenu } from './NodeContextMenu'
import { PaneContextMenu } from './PaneContextMenu'
import { CreatePersonDialog } from './CreatePersonDialog'
import { StatsPanel } from './controls/StatsPanel'
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
  const { data: relationshipsData, isLoading: relationshipsLoading } = useRelationships(userId, {
    enabled: !readOnly,
  })
  const relationships = initialRelationships || relationshipsData || EMPTY_RELATIONSHIPS
  const isInitialLoading = !readOnly && relationshipsLoading && !initialRelationships && !relationshipsData

  // UI state
  const openPersonModal = useUIStore((state) => state.openPersonModal)
  const nodeDisplayMode = useUIStore((state) => state.nodeDisplayMode)
  const moveSpouseTogether = useUIStore((state) => state.moveSpouseTogether)
  
  const layoutOptions = useMemo(() => {
    switch (nodeDisplayMode) {
      case 'compact':
        return { nodeWidth: 140, nodeHeight: 40 }
      case 'portrait':
        return { nodeWidth: 180, nodeHeight: 240 }
      case 'detailed':
        return { nodeWidth: 240, nodeHeight: 80 }
      default:
        return { nodeWidth: 200, nodeHeight: 50 }
    }
  }, [nodeDisplayMode])

  const { mutate: createRelationship } = useCreateRelationship()
  const { mutateAsync: createPerson } = useCreatePerson()
  const { mutateAsync: deletePerson } = useDeletePerson()
  const { mutateAsync: deleteRelationship } = useDeleteRelationship()
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [actionLoadingLabel, setActionLoadingLabel] = useState<string | null>(null)
  const [createDialogState, setCreateDialogState] = useState<{
    isOpen: boolean
    position?: { x: number; y: number }
  }>({ isOpen: false })
  const keywordInputRef = useRef<HTMLInputElement | null>(null)
  const isActionLoading = actionLoadingLabel !== null
  const isBusy = isInitialLoading || isActionLoading
  const canvasLoadingLabel = isActionLoading
    ? actionLoadingLabel ?? undefined
    : isInitialLoading
      ? 'Loading family tree...'
      : undefined

  const { filteredPersons, filteredRelationships } = useTreeFilters(persons, relationships)

  // Custom hooks
  const { nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange } = useFamilyTreeLayout({
    persons: filteredPersons,
    relationships: filteredRelationships,
    layoutOptions,
  })

  const { onExport, onExportGedcom, onExportJson } = useFamilyTreeExport({
    persons: filteredPersons,
    relationships: filteredRelationships,
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
    saveNodePositionImmediate,
    batchSavePositions,
  } = usePositionManagement({ readOnly, userId })

  const {
    canUndo,
    canRedo,
    pushHistory,
    handleUndo,
    handleRedo,
  } = useFamilyTreeHistory({
    nodes,
    edges,
    setNodes,
    setEdges,
    batchSavePositions,
  })

  const { onNodeDrag, onNodeDragStart, onNodeDragStop } = useNodeDragging({
    nodes,
    edges,
    setNodes,
    setEdges,
    readOnly,
    moveSpouseTogether,
    saveNodePosition,
    saveNodePositionImmediate,
    batchSavePositions,
    pushHistory,
  })

  const { isSpacePressed } = useFamilyTreeShortcuts({
    handleUndo,
    handleRedo,
    setFilterOpen,
  })

  const { contextMenu, onNodeContextMenu, onPaneContextMenu, onPaneClick, closeContextMenu } = useFamilyTreeContextMenu()

  const layoutInProgressRef = useRef(false)

  const handleAddPerson = useCallback(async () => {
    if (!contextMenu || contextMenu.type !== 'pane') return
    if (!rfInstance) return

    if (contextMenu.clientX === undefined || contextMenu.clientY === undefined) {
      toast.error('Cannot determine position')
      return
    }

    const position = rfInstance.screenToFlowPosition({
      x: contextMenu.clientX,
      y: contextMenu.clientY,
    })

    setCreateDialogState({
      isOpen: true,
      position,
    })
    closeContextMenu()
  }, [contextMenu, rfInstance, closeContextMenu])

  const handleCreatePersonSubmit = useCallback(async (values: { name: string; gender?: string }) => {
    if (!createDialogState.position) return

    try {
      await createPerson({
        name: values.name,
        gender: values.gender,
        user_id: userId,
        position_x: createDialogState.position.x,
        position_y: createDialogState.position.y,
      })
      toast.success('Person created')
      setCreateDialogState({ isOpen: false })
    } catch (error) {
      console.error('Failed to create person:', error)
      toast.error('Failed to create person')
    }
  }, [createDialogState.position, createPerson, userId])

  const runAction = useCallback(async (label: string, action: () => Promise<void> | void) => {
    setActionLoadingLabel(label)
    // Give UI time to update
    await new Promise((resolve) => setTimeout(resolve, 50))
    try {
      await action()
    } finally {
      // Ensure UI updates before removing loading state
      await new Promise((resolve) => requestAnimationFrame(resolve))
      setActionLoadingLabel(null)
    }
  }, [])

  // Handlers
  const handleMiniMapClick = useCallback(
    (_: React.MouseEvent, position: { x: number; y: number }) => {
      if (!rfInstance) return
      rfInstance.setCenter(position.x, position.y, {
        zoom: rfInstance.getZoom(),
        duration: 200,
      })
    },
    [rfInstance]
  )

  const handleFocusPerson = useCallback(
    (personId: string) => {
      if (!rfInstance) return

      const node = nodes.find((n) => n.id === personId)
      if (!node) {
        toast.error('Person not found in current view')
        return
      }

      rfInstance.fitView({
        nodes: [{ id: personId }],
        padding: 2,
        duration: 800,
      })
      
      setNodes((nds) => 
        nds.map((n) => ({
          ...n,
          selected: n.id === personId
        }))
      )
    },
    [rfInstance, nodes, setNodes]
  )

  const handleAutoLayout = useCallback(async () => {
    if (layoutInProgressRef.current) {
      toast.warning('Layout already in progress')
      return
    }

    layoutInProgressRef.current = true
    try {
      await runAction('Arranging...', async () => {
        pushHistory()
        const { nodes: newNodes, edges: newEdges } = getLayoutedElements(nodes, edges, layoutOptions)
        setNodes(newNodes)
        setEdges(newEdges)

        try {
          await batchSavePositions(newNodes)
          toast.success('Layout saved')
        } catch (error) {
          console.error('Failed to save layout:', error)
          toast.error('Failed to save layout')
        }
      })
    } finally {
      layoutInProgressRef.current = false
    }
  }, [nodes, edges, setNodes, setEdges, batchSavePositions, runAction, layoutOptions, pushHistory])

  const handleExport = useCallback(async () => {
    await runAction('Exporting PNG...', onExport)
  }, [onExport, runAction])

  const handleExportGedcom = useCallback(async () => {
    await runAction('Exporting GEDCOM...', onExportGedcom)
  }, [onExportGedcom, runAction])

  const handleExportJson = useCallback(async () => {
    await runAction('Exporting JSON...', onExportJson)
  }, [onExportJson, runAction])

  const handleImportGedcomWithLoading = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await runAction('Importing GEDCOM...', () => handleImportGedcom(event))
    },
    [handleImportGedcom, runAction]
  )

  const handleImportJsonWithLoading = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await runAction('Importing JSON...', () => handleImportJson(event))
    },
    [handleImportJson, runAction]
  )

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
        pushHistory()
        await deleteRelationship({ id: relationshipId, userId })
        setEdges((eds) => eds.filter((edge) => edge.id !== relationshipId))
        toast.success('Relationship deleted')
      } catch (error) {
        console.error('Failed to delete relationship:', error)
        toast.error('Failed to delete relationship')
      }
    },
    [deleteRelationship, pushHistory, readOnly, setEdges, userId]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return

      const isSpouseConnection =
        params.sourceHandle?.startsWith('spouse') ||
        params.targetHandle?.startsWith('spouse')
      const relationshipType = isSpouseConnection ? 'spouse' : 'parent'

      // Optimistic update
      pushHistory()
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
    [pushHistory, setEdges, createRelationship, userId, readOnly]
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
        pushHistory()
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
    [readOnly, onEdgesChange, deleteRelationship, userId, pushHistory]
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
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onInit={setRfInstance}
        panOnDrag={true}
        nodesDraggable={!readOnly}
        onMiniMapClick={handleMiniMapClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        isLoading={isInitialLoading || isActionLoading}
        loadingLabel={canvasLoadingLabel}
        statsPanel={<StatsPanel persons={persons} relationships={relationships} />}
        contextMenu={
          contextMenu && (
            contextMenu.type === 'node' && contextMenu.id ? (
              <NodeContextMenu
                id={contextMenu.id}
                top={contextMenu.top}
                left={contextMenu.left}
                onEdit={openPersonModal}
                onDelete={handleDeletePersonFromNode}
                onClose={closeContextMenu}
              />
            ) : contextMenu.type === 'pane' ? (
              <PaneContextMenu
                top={contextMenu.top}
                left={contextMenu.left}
                onAddPerson={handleAddPerson}
                onClose={closeContextMenu}
              />
            ) : null
          )
        }
      >
        <FamilyTreeControls
          userId={userId}
          persons={filteredPersons}
          readOnly={readOnly}
          onAutoLayout={handleAutoLayout}
          onFocus={handleFocusPerson}
          onExport={handleExport}
          onExportGedcom={handleExportGedcom}
          onExportJson={handleExportJson}
          onImportGedcom={triggerImport}
          onImportJson={triggerImportJson}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          isBusy={isBusy}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
        keywordInputRef={keywordInputRef}
        />
      </FamilyTreeCanvas>

      {/* Hidden file inputs */}
      <CreatePersonDialog
        isOpen={createDialogState.isOpen}
        onClose={() => setCreateDialogState((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleCreatePersonSubmit}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportGedcomWithLoading}
        className="hidden"
        accept=".ged,.gedcom"
      />
      <input
        type="file"
        ref={jsonFileInputRef}
        onChange={handleImportJsonWithLoading}
        className="hidden"
        accept=".json"
      />
    </>
  )
}
