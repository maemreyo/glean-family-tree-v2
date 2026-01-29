import { useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  Connection,
  NodeDragHandler,
  ReactFlowInstance,
  ConnectionMode,
  Viewport,
} from 'reactflow'
import { Loader2 } from 'lucide-react'
import { PersonNode } from './PersonNode'
import { SpouseEdge, RelationshipEdge } from './SpouseEdge'

const NODE_WIDTH = 200
const NODE_HEIGHT = 50
const VIEWPORT_MARGIN = 200

const nodeTypes = {
  person: PersonNode,
}

const edgeTypes = {
  spouse: SpouseEdge,
  relationship: RelationshipEdge,
}

interface FamilyTreeCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
  onNodeClick: (event: React.MouseEvent, node: Node) => void
  onNodeDrag?: NodeDragHandler
  onNodeDragStart?: NodeDragHandler
  onNodeDragStop: NodeDragHandler
  onInit: (instance: ReactFlowInstance) => void
  panOnDrag?: boolean | number[]
  nodesDraggable?: boolean
  onMiniMapClick?: (event: React.MouseEvent, position: { x: number; y: number }) => void
  onNodeContextMenu?: (event: React.MouseEvent, node: Node) => void
  onPaneClick?: (event: React.MouseEvent) => void
  isLoading?: boolean
  loadingLabel?: string
  children?: React.ReactNode
  contextMenu?: React.ReactNode
  statsPanel?: React.ReactNode
}

export function FamilyTreeCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDrag,
  onNodeDragStart,
  onNodeDragStop,
  onInit,
  panOnDrag,
  nodesDraggable,
  onMiniMapClick,
  onNodeContextMenu,
  onPaneClick,
  isLoading,
  loadingLabel,
  children,
  contextMenu,
  statsPanel,
}: FamilyTreeCanvasProps) {
  const shouldVirtualize = nodes.length >= 500
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 })
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const updateSize = () => {
      setViewportSize({
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
      })
    }
    updateSize()
    const observer = new ResizeObserver(() => {
      updateSize()
    })
    observer.observe(wrapper)
    return () => {
      observer.disconnect()
    }
  }, [])

  const viewportBounds = useMemo(() => {
    if (!shouldVirtualize) return null
    if (!viewportSize.width || !viewportSize.height) return null
    const left = -viewport.x / viewport.zoom - VIEWPORT_MARGIN
    const top = -viewport.y / viewport.zoom - VIEWPORT_MARGIN
    const right = left + viewportSize.width / viewport.zoom + VIEWPORT_MARGIN * 2
    const bottom = top + viewportSize.height / viewport.zoom + VIEWPORT_MARGIN * 2
    return { left, right, top, bottom }
  }, [shouldVirtualize, viewport, viewportSize])

  const visibleNodes = useMemo(() => {
    if (!shouldVirtualize || !viewportBounds) return nodes
    return nodes.filter((node) => {
      const width = node.width ?? NODE_WIDTH
      const height = node.height ?? NODE_HEIGHT
      const position = node.positionAbsolute ?? node.position
      const nodeLeft = position.x
      const nodeTop = position.y
      const nodeRight = nodeLeft + width
      const nodeBottom = nodeTop + height
      return (
        nodeRight >= viewportBounds.left &&
        nodeLeft <= viewportBounds.right &&
        nodeBottom >= viewportBounds.top &&
        nodeTop <= viewportBounds.bottom
      )
    })
  }, [nodes, shouldVirtualize, viewportBounds])

  const visibleNodeIds = useMemo(() => {
    if (!shouldVirtualize) return null
    return new Set(visibleNodes.map((node) => node.id))
  }, [shouldVirtualize, visibleNodes])

  const visibleEdges = useMemo(() => {
    if (!shouldVirtualize || !visibleNodeIds) return edges
    return edges.filter(
      (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    )
  }, [edges, shouldVirtualize, visibleNodeIds])

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/80">
          <div className="flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm shadow">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingLabel ?? 'Loading...'}</span>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        panOnDrag={panOnDrag}
        nodesDraggable={nodesDraggable}
        onlyRenderVisibleElements={shouldVirtualize}
        onMove={(_, nextViewport) => setViewport(nextViewport)}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={{
          animated: false,
        }}
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const hasSpouses = node.data?.spouseCount > 0
            return hasSpouses ? 'var(--minimap-node-spouse)' : 'var(--minimap-node)'
          }}
          pannable
          zoomable
          onClick={onMiniMapClick}
        />
        <Background gap={12} size={1} />
        <Panel position="top-right">{children}</Panel>
        <Panel position="top-left">{statsPanel}</Panel>
      </ReactFlow>
      {contextMenu}
    </div>
  )
}
