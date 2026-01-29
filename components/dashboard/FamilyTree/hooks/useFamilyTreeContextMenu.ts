import { useState, useCallback, useEffect } from 'react'
import { Node } from 'reactflow'
import { useUIStore } from '@/providers/ui-store-provider'

export function useFamilyTreeContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    id?: string
    type: 'node' | 'pane'
    top: number
    left: number
    clientX?: number
    clientY?: number
    position?: { x: number; y: number }
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
          type: 'node',
          top: event.clientY - rect.top,
          left: event.clientX - rect.left,
        })
      } else {
        setContextMenu({
          id: node.id,
          type: 'node',
          top: event.clientY,
          left: event.clientX,
        })
      }
    },
    []
  )

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault()
      
      // We need to calculate flow position in the component using rfInstance
      // Here we just set screen position for the menu
      const pane = (event.target as Element).closest('.react-flow')
      if (pane) {
        const rect = pane.getBoundingClientRect()
        setContextMenu({
          type: 'pane',
          top: (event as React.MouseEvent).clientY - rect.top,
          left: (event as React.MouseEvent).clientX - rect.left,
          clientX: (event as React.MouseEvent).clientX,
          clientY: (event as React.MouseEvent).clientY,
        })
      }
    },
    []
  )

  const onPaneClick = useCallback(() => setContextMenu(null), [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  return {
    contextMenu,
    setContextMenu, // Export setter to allow custom handling in index.tsx
    onNodeContextMenu,
    onPaneContextMenu,
    onPaneClick,
    closeContextMenu,
  }
}
