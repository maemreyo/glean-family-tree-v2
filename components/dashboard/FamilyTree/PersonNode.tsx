import { useState, type MouseEvent } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { User, Heart, X } from 'lucide-react'
import { useUIStore } from '@/providers/ui-store-provider'

export function PersonNode({ id, data }: NodeProps) {
  const [hoverOpen, setHoverOpen] = useState(false)
  const nodeDisplayMode = useUIStore((state) => state.nodeDisplayMode)
  const isNodeDragging = useUIStore((state) => state.isNodeDragging)
  
  const profilePhoto = data.person_photos?.find((p: any) => p.is_profile_picture) || data.person_photos?.[0]
  const hasSpouses = data.spouseCount > 0
  const statusKey =
    data.is_deceased === true ? 'deceased' : data.is_deceased === false ? 'living' : 'unknown'
  const genderValue = typeof data.gender === 'string' ? data.gender.toLowerCase() : ''
  const genderKey =
    genderValue === 'male' || genderValue === 'm' || genderValue === 'nam'
      ? 'male'
      : genderValue === 'female' || genderValue === 'f' || genderValue === 'nu' || genderValue === 'nữ'
        ? 'female'
        : genderValue
          ? 'other'
          : 'unknown'
  const genderLabel =
    genderKey === 'male' ? 'Male' : genderKey === 'female' ? 'Female' : genderKey === 'other' ? 'Other' : 'Unknown'
  const statusLabel = statusKey === 'living' ? 'Living' : statusKey === 'deceased' ? 'Deceased' : 'Unknown'
  const birthLabel = data.date_of_birth
    ? new Date(data.date_of_birth).toLocaleDateString()
    : 'Unknown'

  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation()
    if (data?.readOnly) return
    const confirmed = window.confirm('Are you sure you want to delete this person?')
    if (!confirmed) return
    data?.onDelete?.(id)
  }
  
  // Render based on display mode
  const renderContent = () => {
    // COMPACT MODE
    if (nodeDisplayMode === 'compact') {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full px-1">
          <span className="truncate text-xs font-semibold leading-tight text-center w-full">
            {data.label}
          </span>
          {data.date_of_birth && (
            <span className="text-[10px] text-muted-foreground leading-none">
              {new Date(data.date_of_birth).getFullYear()}
            </span>
          )}
        </div>
      )
    }

    // PORTRAIT MODE
    if (nodeDisplayMode === 'portrait') {
      return (
        <div className="flex flex-col items-center w-full h-full relative overflow-hidden bg-background group-hover:bg-muted transition-colors">
          <div className="absolute inset-0 z-0">
            {profilePhoto?.url ? (
              <img 
                src={profilePhoto.url} 
                alt={data.label} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <User className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
          
          {/* Gradient Overlay with more definition */}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-3 px-3 flex flex-col justify-end">
            <span className="text-white font-bold text-sm leading-tight drop-shadow-md line-clamp-2 mb-0.5">
              {data.label}
            </span>
            
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-white/90 font-medium drop-shadow-sm truncate">
                {data.date_of_birth ? new Date(data.date_of_birth).getFullYear() : '?'}
                {data.is_deceased && (
                  <> - {data.date_of_death ? new Date(data.date_of_death).getFullYear() : '?'}</>
                )}
              </span>
              
              {hasSpouses && (
                 <Heart className="h-3 w-3 text-pink-400 fill-pink-400 drop-shadow-md shrink-0" />
              )}
            </div>
          </div>
          
          {/* Status Indicator Dot */}
          <div 
            className={`absolute top-2 right-2 h-2 w-2 rounded-full border border-white/20 shadow-sm ${
              statusKey === 'living' ? 'bg-green-500' : 
              statusKey === 'deceased' ? 'bg-neutral-500' : 'bg-yellow-500'
            }`} 
          />
        </div>
      )
    }

    // DETAILED MODE
    if (nodeDisplayMode === 'detailed') {
      return (
        <div className="flex h-full w-full items-start gap-3 p-2">
          <Avatar className="person-node-avatar h-10 w-10 border mt-0.5">
            <AvatarImage src={profilePhoto?.url} alt={data.label} className="object-cover" />
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col min-w-0 flex-1">
            <span className="truncate text-sm font-bold leading-tight mb-0.5">
              {data.label}
            </span>
            
            <div className="flex flex-col text-[10px] text-muted-foreground gap-0.5">
              <span>
                {data.date_of_birth ? new Date(data.date_of_birth).getFullYear() : '?'} 
                {' - '}
                {data.is_deceased && data.date_of_death ? new Date(data.date_of_death).getFullYear() : (data.is_deceased ? '?' : '')}
              </span>
              
              {data.occupation && (
                <span className="truncate opacity-80">{data.occupation}</span>
              )}
              
              {data.birth_place && (
                <span className="truncate opacity-80">{data.birth_place}</span>
              )}
            </div>

            {hasSpouses && data.spouseNames && (
              <span className="text-[10px] truncate mt-1 text-[color:var(--spouse-text)] font-medium">
                ♥ {data.spouseNames}
              </span>
            )}
          </div>
        </div>
      )
    }

    // DEFAULT MODE
    return (
      <div className="flex h-full w-full items-center gap-3 p-2">
        <Avatar className="person-node-avatar h-8 w-8 border">
          <AvatarImage src={profilePhoto?.url} alt={data.label} className="object-cover" />
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-medium leading-none">
            {data.label}
          </span>
          {data.date_of_birth && (
            <span className="text-xs text-muted-foreground">
              {new Date(data.date_of_birth).getFullYear()}
            </span>
          )}
          {hasSpouses && data.spouseNames && (
            <span className="text-[10px] truncate mt-0.5 text-[color:var(--spouse-text)]">
              ♥ {data.spouseNames}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Calculate dynamic dimensions or styles based on mode
  const getNodeStyle = () => {
    switch (nodeDisplayMode) {
      case 'compact':
        return 'h-[40px] w-[140px] p-0'
      case 'portrait':
        return 'h-[240px] w-[180px] p-0 overflow-hidden'
      case 'detailed':
        return 'h-[80px] w-[240px] p-0'
      default:
        return 'h-[50px] w-[200px] p-2'
    }
  }

  const isPortraitOrCompact = nodeDisplayMode === 'portrait' || nodeDisplayMode === 'compact'
  
  // Don't show popover if dragging
  const showHover = hoverOpen && !isNodeDragging

  return (
    <Popover open={showHover} onOpenChange={setHoverOpen}>
      <PopoverTrigger asChild>
        <div
          className={`relative group transition-all duration-300 ${nodeDisplayMode === 'portrait' ? 'w-[180px]' : nodeDisplayMode === 'compact' ? 'w-[140px]' : nodeDisplayMode === 'detailed' ? 'w-[240px]' : 'w-[200px]'}`}
          onMouseEnter={() => setHoverOpen(true)}
          onMouseLeave={() => setHoverOpen(false)}
        >
      {/* Spouse indicator badge */}
      {hasSpouses && nodeDisplayMode !== 'compact' && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="rounded-full h-5 w-5 flex items-center justify-center border-2 shadow-md bg-[color:var(--spouse-badge-bg)] text-[color:var(--spouse-badge-fg)] border-[color:var(--spouse-badge-border)]">
            <Heart className="h-3 w-3 fill-[color:var(--spouse-badge-fg)] text-[color:var(--spouse-badge-fg)]" />
          </div>
          {data.spouseCount > 1 && (
            <div className="absolute -bottom-1 -right-1 text-[color:var(--spouse-badge-fg)] text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border shadow-sm bg-[color:var(--spouse-count-bg)] border-[color:var(--spouse-badge-border)]">
              {data.spouseCount}
            </div>
          )}
        </div>
      )}
      
      <div
        className={`person-node rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800/90 ${getNodeStyle()} ${
          hasSpouses ? 'ring-2 ring-[color:var(--spouse-ring)]' : ''
        } ${!isPortraitOrCompact ? 'flex items-center gap-3' : ''}`}
        data-status={statusKey}
        data-gender={genderKey}
      >
        {!isPortraitOrCompact && <div className="person-node-accent" />}
        {!data?.readOnly && (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-background text-destructive border border-border shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <Handle 
          id="top"
          type="target" 
          position={Position.Top} 
          className="family-handle family-handle-parent opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          style={{ top: -6 }}
        />
        
        {renderContent()}

        <Handle 
          id="bottom"
          type="source" 
          position={Position.Bottom} 
          className="family-handle family-handle-parent opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          style={{ bottom: -6 }}
        />
        
        {/* Side handles for spouse connections */}
        <Handle 
          type="source" 
          position={Position.Right} 
          id="spouse-right"
          className="family-handle family-handle-spouse opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          style={{ right: -4, top: '50%' }}
        />
        <Handle 
          type="target" 
          position={Position.Left} 
          id="spouse-left"
          className="family-handle family-handle-spouse opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          style={{ left: -4, top: '50%' }}
        />
      </div>
    </div>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="center"
        className="w-64"
        onMouseEnter={() => setHoverOpen(true)}
        onMouseLeave={() => setHoverOpen(false)}
      >
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={profilePhoto?.url} alt={data.label} className="object-cover" />
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{data.label}</div>
            <div className="text-xs text-muted-foreground">
              {statusLabel} · {genderLabel}
            </div>
            <div className="mt-2 grid gap-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Born</span>
                <span className="truncate">{birthLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spouses</span>
                <span className="truncate">
                  {hasSpouses ? data.spouseNames || `${data.spouseCount}` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
