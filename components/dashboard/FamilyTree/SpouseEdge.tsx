import type { MouseEvent } from 'react'
import { EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from 'reactflow'
import { Heart, X } from 'lucide-react'
import { useEdgeHover } from './hooks/useEdgeHover'

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
  const { isHovered, handleEnter, handleLeave } = useEdgeHover(240)
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
      {data?.hidden ? null : (
        <>
      <path
        id={`${id}-hitbox`}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          strokeWidth: 'var(--edge-hitbox-width)',
          stroke: 'transparent',
        }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      />
      <path
        id={`${id}-bg`}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          strokeWidth: 'var(--edge-spouse-bg-width)',
          stroke: 'var(--relationship-spouse-bg)',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      />
      
      {/* Main pink edge */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          strokeWidth: 'var(--edge-spouse-width)',
          stroke: 'var(--relationship-spouse)',
          strokeDasharray: '10 5',
          animation: 'dash 1s linear infinite',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
        markerEnd={markerEnd}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
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
        <div className="flex items-center justify-center w-full h-full animate-pulse">
          <div className="rounded-full p-1 border-2 shadow-sm bg-[color:var(--spouse-heart-bg)] border-[color:var(--spouse-heart-border)]">
            <Heart className="h-3 w-3 text-[color:var(--spouse-heart-icon)] fill-[color:var(--spouse-heart-icon)]" />
          </div>
        </div>
      </foreignObject>
      <EdgeLabelRenderer>
        <div
          className="pointer-events-auto"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX + 18}px,${labelY - 18}px)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 150ms ease',
            pointerEvents: isHovered ? 'auto' : 'none',
          }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <button
            type="button"
            onClick={handleDelete}
            className="h-5 w-5 rounded-full bg-background text-destructive border border-border shadow flex items-center justify-center hover:bg-destructive/10"
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
      )}
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
  const { isHovered, handleEnter, handleLeave } = useEdgeHover(240)
  const resolvedSourceX = typeof data?.sourceX === 'number' ? data.sourceX : sourceX
  const resolvedSourceY = typeof data?.sourceY === 'number' ? data.sourceY : sourceY
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: resolvedSourceX,
    sourceY: resolvedSourceY,
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
      {data?.hidden ? null : (
        <>
          <path
            id={`${id}-hitbox`}
            className="react-flow__edge-path"
            d={edgePath}
            style={{
              strokeWidth: 'var(--edge-hitbox-width)',
              stroke: 'transparent',
            }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          />
          <path
            id={id}
            className="react-flow__edge-path"
            d={edgePath}
            style={{
              ...style,
              strokeWidth: 'var(--edge-parent-width)',
              stroke: style?.stroke || 'var(--relationship-parent)',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            markerEnd={markerEnd}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          />
          <EdgeLabelRenderer>
            <div
              className="pointer-events-auto"
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 150ms ease',
                pointerEvents: isHovered ? 'auto' : 'none',
              }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              <button
                type="button"
                onClick={handleDelete}
                className="h-5 w-5 rounded-full bg-background text-destructive border border-border shadow flex items-center justify-center hover:bg-destructive/10"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </EdgeLabelRenderer>
        </>
      )}
    </>
  )
}
