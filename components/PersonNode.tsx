import { Handle, Position, NodeProps } from 'reactflow'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { User } from 'lucide-react'

export function PersonNode({ data }: NodeProps) {
  const profilePhoto = data.person_photos?.find((p: any) => p.is_profile_picture) || data.person_photos?.[0]
  
  return (
    <div className="flex h-[50px] w-[200px] items-center gap-3 rounded-lg border bg-white p-2 shadow-sm transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      
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
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  )
}
