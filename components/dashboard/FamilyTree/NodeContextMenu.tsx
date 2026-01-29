
import { Edit, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useRef } from 'react'

interface NodeContextMenuProps {
  id: string
  top: number
  left: number
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function NodeContextMenu({ id, top, left, onEdit, onDelete, onClose }: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
      style={{
        top,
        left,
      }}
    >
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 px-2 h-8 font-normal"
          onClick={() => {
            onEdit(id)
            onClose()
          }}
        >
          <Edit className="h-4 w-4" />
          Edit Person
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 px-2 h-8 font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            onDelete(id)
            onClose()
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete Person
        </Button>
      </div>
    </div>
  )
}
