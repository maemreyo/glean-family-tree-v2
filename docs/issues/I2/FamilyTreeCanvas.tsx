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
} from 'reactflow'
import { PersonNode } from './PersonNode'

const nodeTypes = {
  person: PersonNode,
}

interface FamilyTreeCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
  onNodeClick: (event: React.MouseEvent, node: Node) => void
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
        onNodeDragStop={onNodeDragStop}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
        <Panel position="top-right">{children}</Panel>
      </ReactFlow>
    </div>
  )
}
