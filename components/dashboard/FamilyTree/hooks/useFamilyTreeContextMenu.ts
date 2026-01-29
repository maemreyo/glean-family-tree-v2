import { useState, useCallback, useEffect } from 'react'
import { Node } from 'reactflow'
import { useUIStore } from '@/providers/ui-store-provider'

export function useFamilyTreeContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    id: string
    top: number
    left: number
  } | null>(null)
  
  const setIsContextMenuOpen = useUIStore((state) => state.setIsContextMenuOpen)
  
  // Sync state with global store
  useEffect(() => {
    setIsContextMenuOpen(!!contextMenu)
  }, [contextMenu, setIsContextMenuOpen])

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      
      const pane = (event.target as Element).closest('.react-flow')
      if (pane) {
        const rect = pane.getBoundingClientRect()
        setContextMenu({
          id: node.id,
          top: event.clientY - rect.top,
          left: event.clientX - rect.left,
        })
      } else {
        setContextMenu({
          id: node.id,
          top: event.clientY,
          left: event.clientX,
        })
      }
    },
    []
  )

  const onPaneClick = useCallback(() => setContextMenu(null), [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  return {
    contextMenu,
    onNodeContextMenu,
    onPaneClick,
    closeContextMenu,
  }
}
