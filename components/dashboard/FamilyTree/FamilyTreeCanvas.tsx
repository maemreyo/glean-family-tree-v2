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
import { SpouseEdge } from './SpouseEdge'

const nodeTypes = {
  person: PersonNode,
}

const edgeTypes = {
  spouse: SpouseEdge,
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
  children,
}: FamilyTreeCanvasProps) {
  return (
    <div className="h-full w-full rounded-lg border bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
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
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={{
          animated: false,
        }}
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            // Color nodes based on spouse status
            const hasSpouses = node.data?.spouseCount > 0
            return hasSpouses ? '#fce7f3' : '#f3f4f6'
          }}
        />
        <Background gap={12} size={1} />
        <Panel position="top-right">{children}</Panel>
      </ReactFlow>
    </div>
  )
}
