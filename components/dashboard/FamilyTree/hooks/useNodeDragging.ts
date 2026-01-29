import { useCallback, useRef } from 'react'
import { Node, Edge } from 'reactflow'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/utils'
import { updateSharedChildEdges } from '../utils/dagre-layout'
import { useUIStore } from '@/providers/ui-store-provider'

interface UseNodeDraggingProps {
  nodes: Node[]
  edges: Edge[]
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void
  readOnly: boolean
  moveSpouseTogether: boolean
  saveNodePosition: (id: string, x: number, y: number) => void
  saveNodePositionImmediate: (id: string, x: number, y: number) => void
  batchSavePositions: (nodes: Node[]) => Promise<void>
  pushHistory: () => void
}

export function useNodeDragging({
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
}: UseNodeDraggingProps) {
  const dragNodeIdRef = useRef<string | null>(null)
  const lastDragPosRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const setIsNodeDragging = useUIStore((state) => state.setIsNodeDragging)

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

  const refreshSharedChildEdges = useCallback(
    (movedNode: Node) => {
      const updatedNodes = nodes.map((node) =>
        node.id === movedNode.id ? { ...node, position: movedNode.position } : node
      )
      setEdges((currentEdges) => updateSharedChildEdges(updatedNodes, currentEdges))
    },
    [nodes, setEdges]
  )

  const onNodeDragStart = useCallback(() => {
    setIsNodeDragging(true)
  }, [setIsNodeDragging])

  const onNodeDrag = useCallback(
    (event: any, node: Node) => {
      if (readOnly) return
      if (dragNodeIdRef.current !== node.id) {
        pushHistory()
        dragNodeIdRef.current = node.id
        setIsNodeDragging(true)
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
    [
      pushHistory,
      readOnly,
      refreshSharedChildEdges,
      saveNodePosition,
      moveSpouseTogether,
      setNodes,
      setEdges,
      getSpouseGroup,
      setIsNodeDragging,
    ]
  )

  const onNodeDragStop = useCallback(
    async (event: any, node: Node) => {
      setIsNodeDragging(false)
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
    [
      batchSavePositions,
      nodes,
      readOnly,
      refreshSharedChildEdges,
      moveSpouseTogether,
      saveNodePositionImmediate,
      getSpouseGroup,
      setIsNodeDragging,
    ]
  )

  return {
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  }
}
