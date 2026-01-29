import type { MouseEvent } from 'react'
import { EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from 'reactflow'
import { Heart, X } from 'lucide-react'
import { useEdgeHover } from './hooks/useEdgeHover'
import { useThemeColors } from './hooks/useThemeColors'

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
  const themeColors = useThemeColors()
  const spouseStroke =
    typeof style?.stroke === 'string' && !style.stroke.includes('var(')
      ? style.stroke
      : themeColors.spouse
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
        d={edgePath}
        stroke="transparent"
        strokeWidth={themeColors.hitboxWidth}
        fill="none"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      />
      <path
        id={`${id}-bg`}
        d={edgePath}
        stroke={themeColors.spouseBg}
        strokeWidth={themeColors.spouseBgWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      />
      
      {/* Main pink edge */}
      <path
        id={id}
        d={edgePath}
        stroke={spouseStroke}
        strokeWidth={themeColors.spouseWidth}
        strokeDasharray="10 5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{ animation: 'dash 1s linear infinite' }}
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
          <div 
            className="rounded-full p-1 border-2 shadow-sm flex items-center justify-center"
            style={{ 
              backgroundColor: themeColors.spouseHeartBg,
              borderColor: themeColors.spouseHeartBorder 
            }}
          >
            <Heart 
              className="h-3 w-3" 
              style={{ 
                color: themeColors.spouseHeartIcon,
                fill: themeColors.spouseHeartIcon
              }} 
            />
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
  const themeColors = useThemeColors()
  const parentStroke =
    typeof style?.stroke === 'string' && !style.stroke.includes('var(')
      ? style.stroke
      : themeColors.parent
  const parentStrokeWidth =
    typeof style?.strokeWidth === 'number' ? style.strokeWidth : themeColors.parentWidth
  const resolvedSourceX = typeof data?.sourceX === 'number' ? data.sourceX : sourceX
  const resolvedSourceY = typeof data?.sourceY === 'number' ? data.sourceY : sourceY
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: resolvedSourceX,
    sourceY: resolvedSourceY,
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
            d={edgePath}
            stroke="transparent"
            strokeWidth={themeColors.hitboxWidth}
            fill="none"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          />
          <path
            id={`${id}-bg`}
            d={edgePath}
            stroke={themeColors.parentBg}
            strokeWidth={themeColors.spouseBgWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          />
          <path
            id={id}
            d={edgePath}
            stroke={parentStroke}
            strokeWidth={parentStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
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
