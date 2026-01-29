import { useState, type MouseEvent } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { User, Heart, X } from 'lucide-react'

export function PersonNode({ id, data }: NodeProps) {
  const [hoverOpen, setHoverOpen] = useState(false)
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
  
  return (
    <Popover open={hoverOpen} onOpenChange={setHoverOpen}>
      <PopoverTrigger asChild>
        <div
          className="relative w-[200px] group"
          onMouseEnter={() => setHoverOpen(true)}
          onMouseLeave={() => setHoverOpen(false)}
        >
      {/* Spouse indicator badge */}
      {hasSpouses && (
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
        className={`person-node flex h-[50px] w-[200px] items-center gap-3 rounded-lg border bg-card text-card-foreground p-2 shadow-sm transition-all hover:shadow-md ${
        hasSpouses ? 'ring-2 ring-[color:var(--spouse-ring)]' : ''
      }`}
        data-status={statusKey}
        data-gender={genderKey}
      >
        <div className="person-node-accent" />
        {!data?.readOnly && (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-background text-destructive border border-border shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
