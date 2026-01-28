import { EdgeProps, getSmoothStepPath } from 'reactflow'
import { Heart } from 'lucide-react'

export function SpouseEdge({
  id,
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
