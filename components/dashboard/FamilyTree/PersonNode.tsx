import type { MouseEvent } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { User, Heart, X } from 'lucide-react'

export function PersonNode({ id, data }: NodeProps) {
  const profilePhoto = data.person_photos?.find((p: any) => p.is_profile_picture) || data.person_photos?.[0]
  const hasSpouses = data.spouseCount > 0

  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation()
    if (data?.readOnly) return
    const confirmed = window.confirm('Are you sure you want to delete this person?')
    if (!confirmed) return
    data?.onDelete?.(id)
  }
  
  return (
    <div className="relative w-[200px] group">
      {/* Spouse indicator badge */}
      {hasSpouses && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-pink-500 text-white rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-md">
            <Heart className="h-3 w-3 fill-white" />
          </div>
          {data.spouseCount > 1 && (
            <div className="absolute -bottom-1 -right-1 bg-pink-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white shadow-sm">
              {data.spouseCount}
            </div>
          )}
        </div>
      )}
      
      <div className={`flex h-[50px] w-[200px] items-center gap-3 rounded-lg border bg-white p-2 shadow-sm transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-700 ${
        hasSpouses ? 'ring-2 ring-pink-200 dark:ring-pink-900/50' : ''
      }`}>
        {!data?.readOnly && (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-white text-red-500 border shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <Handle 
          type="target" 
          position={Position.Top} 
          className="!bg-gray-400 !w-3 !h-3" 
          style={{ top: -6 }}
        />
        
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={profilePhoto?.url} alt={data.label} className="object-cover" />
          <AvatarFallback className="bg-gray-100 text-gray-400 dark:bg-gray-700">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
            {data.label}
          </span>
          {data.date_of_birth && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(data.date_of_birth).getFullYear()}
            </span>
          )}
          {hasSpouses && data.spouseNames && (
            <span className="text-[10px] text-pink-600 dark:text-pink-400 truncate mt-0.5">
              ♥ {data.spouseNames}
            </span>
          )}
        </div>

        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="!bg-gray-400 !w-3 !h-3" 
          style={{ bottom: -6 }}
        />
        
        {/* Side handles for spouse connections */}
        <Handle 
          type="source" 
          position={Position.Right} 
          id="spouse-right"
          className="!bg-pink-400 !w-2 !h-2 !rounded-full" 
          style={{ right: -4, top: '50%' }}
        />
        <Handle 
          type="target" 
          position={Position.Left} 
          id="spouse-left"
          className="!bg-pink-400 !w-2 !h-2 !rounded-full" 
          style={{ left: -4, top: '50%' }}
        />
      </div>
    </div>
  )
}
