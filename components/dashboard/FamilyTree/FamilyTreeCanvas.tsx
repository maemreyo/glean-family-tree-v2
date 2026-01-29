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
} from 'reactflow'
import { PersonNode } from './PersonNode'
import { SpouseEdge, RelationshipEdge } from './SpouseEdge'

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
  onNodeDragStop: NodeDragHandler
  onInit: (instance: ReactFlowInstance) => void
  panOnDrag?: boolean | number[]
  nodesDraggable?: boolean
  onMiniMapClick?: (event: React.MouseEvent, position: { x: number; y: number }) => void
  children?: React.ReactNode
}

export function FamilyTreeCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDrag,
  onNodeDragStop,
  onInit,
  panOnDrag,
  nodesDraggable,
  onMiniMapClick,
  children,
}: FamilyTreeCanvasProps) {
  const shouldVirtualize = nodes.length >= 500

  return (
    <div className="h-full w-full rounded-lg border bg-card text-card-foreground shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        panOnDrag={panOnDrag}
        nodesDraggable={nodesDraggable}
        onlyRenderVisibleElements={shouldVirtualize}
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
      </ReactFlow>
    </div>
  )
}
