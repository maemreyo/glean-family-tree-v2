import type { MouseEvent } from 'react'
import { EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from 'reactflow'
import { Heart, X } from 'lucide-react'

export function SpouseEdge({
  id,
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation()
    if (data?.readOnly) return
    const confirmed = window.confirm('Are you sure you want to delete this relationship?')
    if (!confirmed) return
    data?.onDelete?.(id)
  }

  return (
    <>
      {/* Background white edge for contrast */}
      <path
        id={`${id}-bg`}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          strokeWidth: 5,
          stroke: '#ffffff',
        }}
      />
      
      {/* Main pink edge */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: '#ec4899',
          strokeDasharray: '8, 4',
          animation: 'dash 20s linear infinite',
        }}
        markerEnd={markerEnd}
      />
      
      {/* Heart icon in the middle */}
      <foreignObject
        width={24}
        height={24}
        x={labelX - 12}
        y={labelY - 12}
        className="overflow-visible"
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-center justify-center w-full h-full">
          <div className="bg-pink-100 rounded-full p-1 border-2 border-pink-500 shadow-sm">
            <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
          </div>
        </div>
      </foreignObject>
      <EdgeLabelRenderer>
        <div
          className="pointer-events-auto"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX + 18}px,${labelY - 18}px)`,
          }}
        >
          <button
            type="button"
            onClick={handleDelete}
            className="h-5 w-5 rounded-full bg-white text-red-500 border shadow flex items-center justify-center hover:bg-red-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
      
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -24;
          }
        }
      `}</style>
    </>
  )
}

export function RelationshipEdge({
  id,
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation()
    if (data?.readOnly) return
    const confirmed = window.confirm('Are you sure you want to delete this relationship?')
    if (!confirmed) return
    data?.onDelete?.(id)
  }

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: style?.stroke || '#9ca3af',
        }}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          className="pointer-events-auto"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <button
            type="button"
            onClick={handleDelete}
            className="h-5 w-5 rounded-full bg-white text-red-500 border shadow flex items-center justify-center hover:bg-red-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
