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
  const treeFilters = useUIStore((state) => state.treeFilters)
  const { mutate: createRelationship } = useCreateRelationship()
  const { mutateAsync: deletePerson } = useDeletePerson()
  const { mutateAsync: deleteRelationship } = useDeleteRelationship()
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)

  const relationshipIndex = useMemo(() => {
    const index = new Map<string, { isParent: boolean; isChild: boolean; isSpouse: boolean }>()
    persons.forEach((person) => {
      index.set(person.id, { isParent: false, isChild: false, isSpouse: false })
    })
    relationships.forEach((rel) => {
      if (!index.has(rel.from_person_id)) {
        index.set(rel.from_person_id, { isParent: false, isChild: false, isSpouse: false })
      }
      if (!index.has(rel.to_person_id)) {
        index.set(rel.to_person_id, { isParent: false, isChild: false, isSpouse: false })
      }
      if (rel.type === 'parent') {
        index.get(rel.from_person_id)!.isParent = true
        index.get(rel.to_person_id)!.isChild = true
      }
      if (rel.type === 'spouse') {
        index.get(rel.from_person_id)!.isSpouse = true
        index.get(rel.to_person_id)!.isSpouse = true
      }
    })
    return index
  }, [persons, relationships])

  const filteredPersons = useMemo(() => {
    const normalize = (value: string | null | undefined) => value?.toLowerCase().trim() ?? ''
    const minYearRaw = treeFilters.birthYear.min.trim()
    const maxYearRaw = treeFilters.birthYear.max.trim()
    const minYear = minYearRaw ? Number(minYearRaw) : null
    const maxYear = maxYearRaw ? Number(maxYearRaw) : null
    const hasMinYear = minYear !== null && Number.isFinite(minYear)
    const hasMaxYear = maxYear !== null && Number.isFinite(maxYear)
    const keyword = normalize(treeFilters.keyword)
    const birthPlace = normalize(treeFilters.birthPlace)
    const deathPlace = normalize(treeFilters.deathPlace)
    const occupation = normalize(treeFilters.occupation)
    const tagTokens = treeFilters.tags
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
    const relationshipFilters = treeFilters.relationships
    const isAllRelationshipsSelected =
      relationshipFilters.parent &&
      relationshipFilters.child &&
      relationshipFilters.spouse
    const hasAnyRelationshipFilter =
      relationshipFilters.parent ||
      relationshipFilters.child ||
      relationshipFilters.spouse

    return persons.filter((person) => {
      const genderValue = normalize(person.gender)
      const genderKey =
        !genderValue
          ? 'unknown'
          : genderValue === 'male' || genderValue === 'm' || genderValue === 'nam'
            ? 'male'
            : genderValue === 'female' || genderValue === 'f' || genderValue === 'nu' || genderValue === 'nữ'
              ? 'female'
              : 'other'
      if (!treeFilters.gender[genderKey as keyof typeof treeFilters.gender]) return false

      const statusKey =
        person.is_deceased === true
          ? 'deceased'
          : person.is_deceased === false
            ? 'living'
            : 'unknown'
      if (!treeFilters.status[statusKey as keyof typeof treeFilters.status]) return false

      if (hasMinYear || hasMaxYear) {
        const birthYearMatch = person.date_of_birth?.match(/\d{4}/)
        const birthYear = birthYearMatch ? Number(birthYearMatch[0]) : null
        if (hasMinYear && (birthYear === null || birthYear < minYear)) return false
        if (hasMaxYear && (birthYear === null || birthYear > maxYear)) return false
      }

      if (treeFilters.hasPhoto && (!person.person_photos || person.person_photos.length === 0)) {
        return false
      }
      if (treeFilters.hasBiography && !person.biography?.trim()) {
        return false
      }

      if (birthPlace && !normalize(person.birth_place).includes(birthPlace)) return false
      if (deathPlace && !normalize(person.death_place).includes(deathPlace)) return false
      if (occupation && !normalize(person.occupation).includes(occupation)) return false

      if (keyword) {
        const keywordSource = [
          person.name,
          person.nickname,
          person.biography,
          person.notes,
          person.source_notes,
          person.birth_place,
          person.death_place,
          person.occupation,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!keywordSource.includes(keyword)) return false
      }

      if (tagTokens.length > 0) {
        const tagSource = [person.notes, person.source_notes, person.biography]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        const tagsMatch = tagTokens.every((token) => tagSource.includes(token))
        if (!tagsMatch) return false
      }

      if (!isAllRelationshipsSelected) {
        if (!hasAnyRelationshipFilter) return false
        const flags = relationshipIndex.get(person.id) ?? {
          isParent: false,
          isChild: false,
          isSpouse: false,
        }
        const matchesRelationship =
          (relationshipFilters.parent && flags.isParent) ||
          (relationshipFilters.child && flags.isChild) ||
          (relationshipFilters.spouse && flags.isSpouse)
        if (!matchesRelationship) return false
      }

      return true
    })
  }, [persons, relationshipIndex, treeFilters])

  const filteredRelationships = useMemo(() => {
    const allowedPersonIds = new Set(filteredPersons.map((person) => person.id))
    const allowParentEdges =
      treeFilters.relationships.parent || treeFilters.relationships.child
    return relationships.filter((rel) => {
      if (!allowedPersonIds.has(rel.from_person_id) || !allowedPersonIds.has(rel.to_person_id)) {
        return false
      }
      if (rel.type === 'spouse') return treeFilters.relationships.spouse
      if (rel.type === 'parent') return allowParentEdges
      return true
    })
  }, [filteredPersons, relationships, treeFilters.relationships])

  // Custom hooks
  const { nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange } = useFamilyTreeLayout({
    persons: filteredPersons,
    relationships: filteredRelationships,
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
    batchSavePositions,
  } = usePositionManagement({ readOnly, userId })

  const historyRef = useRef<{ past: { nodes: Node[]; edges: Edge[] }[]; future: { nodes: Node[]; edges: Edge[] }[] }>({
    past: [],
    future: [],
  })
  const isApplyingHistoryRef = useRef(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyRef.current.past.length > 0)
    setCanRedo(historyRef.current.future.length > 0)
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
    if (historyRef.current.past.length > 50) {
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

  const onNodeDrag = useCallback(
    (_: any, node: Node) => {
      if (readOnly) return
      if (dragNodeIdRef.current !== node.id) {
        pushHistory()
        dragNodeIdRef.current = node.id
      }
      saveNodePosition(node.id, node.position.x, node.position.y)
      refreshSharedChildEdges(node)
    },
    [pushHistory, readOnly, refreshSharedChildEdges, saveNodePosition]
  )

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (readOnly) return
      saveNodePosition(node.id, node.position.x, node.position.y)
      refreshSharedChildEdges(node)
      dragNodeIdRef.current = null
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
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
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
