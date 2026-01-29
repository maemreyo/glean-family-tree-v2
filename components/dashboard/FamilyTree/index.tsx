'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Connection,
  addEdge,
  Node,
  Edge,
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
import { useTreeFilters } from './hooks/useTreeFilters'
import { FamilyTreeCanvas } from './FamilyTreeCanvas'
import { FamilyTreeControls } from './FamilyTreeControls'
import { NodeContextMenu } from './NodeContextMenu'
import { StatsPanel } from './controls/StatsPanel'
import { getLayoutedElements, updateSharedChildEdges } from './utils/dagre-layout'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/utils'
import 'reactflow/dist/style.css'

type Relationship = Database['public']['Tables']['relationships']['Row']

interface FamilyTreeProps {
  userId: string
  persons: PersonWithPhoto[]
  readOnly?: boolean
  relationships?: Relationship[]
}

const EMPTY_RELATIONSHIPS: Relationship[] = []
const MAX_HISTORY_SIZE = 50

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
  const treeFilters = useUIStore((state) => state.treeFilters)
  const nodeDisplayMode = useUIStore((state) => state.nodeDisplayMode)
  
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
  const { mutateAsync: deletePerson } = useDeletePerson()
  const { mutateAsync: deleteRelationship } = useDeleteRelationship()
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    id: string
    top: number
    left: number
  } | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [actionLoadingLabel, setActionLoadingLabel] = useState<string | null>(null)
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

  const historyRef = useRef<{ past: { nodes: Node[]; edges: Edge[] }[]; future: { nodes: Node[]; edges: Edge[] }[] }>({
    past: [],
    future: [],
  })
  const isApplyingHistoryRef = useRef(false)
  const layoutInProgressRef = useRef(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyRef.current.past.length > 0)
    setCanRedo(historyRef.current.future.length > 0)
  }, [])

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

  const isEditableElement = useCallback((element: Element | null) => {
    if (!element) return false
    const tagName = element.tagName.toLowerCase()
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      (element as HTMLElement).isContentEditable
    )
  }, [])

  const createSnapshot = useCallback(() => {
    return {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    }
  }, [nodes, edges])

  const pushHistory = useCallback(() => {
    if (isApplyingHistoryRef.current) return
    historyRef.current.past.push(createSnapshot())
    historyRef.current.future = []
    if (historyRef.current.past.length > MAX_HISTORY_SIZE) {
      historyRef.current.past.shift()
    }
    updateHistoryState()
  }, [createSnapshot, updateHistoryState])

  const handleUndo = useCallback(() => {
    if (historyRef.current.past.length === 0) return
    const currentSnapshot = createSnapshot()
    const previousSnapshot = historyRef.current.past.pop()
    if (!previousSnapshot) return
    historyRef.current.future.push(currentSnapshot)
    isApplyingHistoryRef.current = true
    setNodes(previousSnapshot.nodes)
    setEdges(previousSnapshot.edges)
    updateHistoryState()
  }, [createSnapshot, setEdges, setNodes, updateHistoryState])

  const handleRedo = useCallback(() => {
    if (historyRef.current.future.length === 0) return
    const currentSnapshot = createSnapshot()
    const nextSnapshot = historyRef.current.future.pop()
    if (!nextSnapshot) return
    historyRef.current.past.push(currentSnapshot)
    isApplyingHistoryRef.current = true
    setNodes(nextSnapshot.nodes)
    setEdges(nextSnapshot.edges)
    updateHistoryState()
  }, [createSnapshot, setEdges, setNodes, updateHistoryState])

  useEffect(() => {
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false
    }
  }, [nodes, edges])

  useEffect(() => {
    historyRef.current.past = []
    historyRef.current.future = []
    updateHistoryState()
  }, [treeFilters, updateHistoryState])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const isMod = event.ctrlKey || event.metaKey
      const isEditable = isEditableElement(document.activeElement)

      if (key === ' ' && !isEditable) {
        event.preventDefault()
        if (!isSpacePressed) {
          setIsSpacePressed(true)
        }
        return
      }

      if (!isMod) return
      if (isEditable && key !== 'f') return

      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }

      if (key === 'f') {
        event.preventDefault()
        setFilterOpen(true)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === ' ') {
        setIsSpacePressed(false)
      }
    }

    const handleBlur = () => {
      setIsSpacePressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [handleRedo, handleUndo, isEditableElement, isSpacePressed])

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

  const dragNodeIdRef = useRef<string | null>(null)
  const lastDragPosRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const moveSpouseTogether = useUIStore((state) => state.moveSpouseTogether)
  const getSpouseGroup = useCallback(
    (id: string) => {
      const group = new Set<string>([id])
      edges.forEach((edge) => {
        if (edge.data?.relationshipType === 'spouse') {
          if (edge.source === id) group.add(edge.target)
          if (edge.target === id) group.add(edge.source)
        }
      })
      return Array.from(group)
    },
    [edges]
  )

  const onNodeDrag = useCallback(
    (event: any, node: Node) => {
      if (readOnly) return
      if (dragNodeIdRef.current !== node.id) {
        pushHistory()
        dragNodeIdRef.current = node.id
      }
      const last = lastDragPosRef.current.get(node.id)
      const dx = last ? node.position.x - last.x : 0
      const dy = last ? node.position.y - last.y : 0
      lastDragPosRef.current.set(node.id, { x: node.position.x, y: node.position.y })

      const isGroup = moveSpouseTogether || !!(event?.shiftKey || event?.altKey)
      if (isGroup && (dx !== 0 || dy !== 0)) {
        const groupIds = new Set(getSpouseGroup(node.id))
        setNodes((prev) => {
          const next = prev.map((n) => {
            if (n.id === node.id) {
              return { ...n, position: node.position }
            }
            if (groupIds.has(n.id)) {
              return {
                ...n,
                position: { x: n.position.x + dx, y: n.position.y + dy },
              }
            }
            return n
          })
          setEdges((curr) => updateSharedChildEdges(next, curr))
          return next
        })
        saveNodePosition(node.id, node.position.x, node.position.y)
      } else {
        saveNodePosition(node.id, node.position.x, node.position.y)
        refreshSharedChildEdges(node)
      }
    },
    [pushHistory, readOnly, refreshSharedChildEdges, saveNodePosition, moveSpouseTogether, setNodes, setEdges, getSpouseGroup]
  )

  const onNodeDragStop = useCallback(
    async (event: any, node: Node) => {
      if (readOnly) return
      const isGroup = moveSpouseTogether || !!(event?.shiftKey || event?.altKey)
      try {
        if (isGroup) {
          const groupIds = new Set(getSpouseGroup(node.id))
          const toSave = nodes.filter((n) => groupIds.has(n.id))
          await batchSavePositions(toSave)
        } else {
          saveNodePositionImmediate(node.id, node.position.x, node.position.y)
        }
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
      refreshSharedChildEdges(node)
      dragNodeIdRef.current = null
      lastDragPosRef.current.delete(node.id)
    },
    [batchSavePositions, nodes, readOnly, refreshSharedChildEdges, moveSpouseTogether, saveNodePositionImmediate, getSpouseGroup]
  )

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      
      const pane = (event.target as Element).closest('.react-flow')
      if (pane) {
        const rect = pane.getBoundingClientRect()
        setContextMenu({
          id: node.id,
          top: event.clientY - rect.top,
          left: event.clientX - rect.left,
        })
      } else {
        setContextMenu({
          id: node.id,
          top: event.clientY,
          left: event.clientX,
        })
      }
    },
    []
  )

  const onPaneClick = useCallback(() => setContextMenu(null), [])

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
        onNodeDragStop={onNodeDragStop}
        onInit={setRfInstance}
        panOnDrag={true}
        nodesDraggable={!readOnly}
        onMiniMapClick={handleMiniMapClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        isLoading={isInitialLoading || isActionLoading}
        loadingLabel={canvasLoadingLabel}
        statsPanel={<StatsPanel persons={persons} relationships={relationships} />}
        contextMenu={
          contextMenu && (
            <NodeContextMenu
              id={contextMenu.id}
              top={contextMenu.top}
              left={contextMenu.left}
              onEdit={openPersonModal}
              onDelete={handleDeletePersonFromNode}
              onClose={() => setContextMenu(null)}
            />
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
