import { useCallback, useRef, useState, useEffect } from 'react'
import { Node, Edge } from 'reactflow'
import { toast } from 'sonner'
import { PersonWithPhoto } from '@/types/app'
import { useUIStore } from '@/providers/ui-store-provider'

const MAX_HISTORY_SIZE = 50

interface UseFamilyTreeHistoryProps {
  nodes: Node[]
  edges: Edge[]
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void
  batchSavePositions: (nodes: Node[]) => Promise<void>
}

export function useFamilyTreeHistory({
  nodes,
  edges,
  setNodes,
  setEdges,
  batchSavePositions,
}: UseFamilyTreeHistoryProps) {
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
    if (historyRef.current.past.length > MAX_HISTORY_SIZE) {
      historyRef.current.past.shift()
    }
    updateHistoryState()
  }, [createSnapshot, updateHistoryState])

  const handleUndo = useCallback(async () => {
    if (historyRef.current.past.length === 0) return
    const currentSnapshot = createSnapshot()
    const previousSnapshot = historyRef.current.past.pop()
    if (!previousSnapshot) return
    historyRef.current.future.push(currentSnapshot)
    isApplyingHistoryRef.current = true
    setNodes(previousSnapshot.nodes)
    setEdges(previousSnapshot.edges)
    updateHistoryState()

    try {
      await batchSavePositions(previousSnapshot.nodes)
    } catch (error) {
      console.error('Failed to save undo state:', error)
      toast.error('Failed to save undo state')
    }
  }, [createSnapshot, setEdges, setNodes, updateHistoryState, batchSavePositions])

  const handleRedo = useCallback(async () => {
    if (historyRef.current.future.length === 0) return
    const currentSnapshot = createSnapshot()
    const nextSnapshot = historyRef.current.future.pop()
    if (!nextSnapshot) return
    historyRef.current.past.push(currentSnapshot)
    isApplyingHistoryRef.current = true
    setNodes(nextSnapshot.nodes)
    setEdges(nextSnapshot.edges)
    updateHistoryState()

    try {
      await batchSavePositions(nextSnapshot.nodes)
    } catch (error) {
      console.error('Failed to save redo state:', error)
      toast.error('Failed to save redo state')
    }
  }, [createSnapshot, setEdges, setNodes, updateHistoryState, batchSavePositions])

  // Reset history when filters change (using store directly to avoid dependency on filtered data)
  const treeFiltersState = useUIStore((state) => state.treeFilters)
  useEffect(() => {
    historyRef.current.past = []
    historyRef.current.future = []
    updateHistoryState()
  }, [treeFiltersState, updateHistoryState])

  // Reset applying flag
  useEffect(() => {
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false
    }
  }, [nodes, edges])

  return {
    canUndo,
    canRedo,
    pushHistory,
    handleUndo,
    handleRedo,
  }
}
