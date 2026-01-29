import { useState, useCallback } from 'react'
import { Node } from 'reactflow'

export function useFamilyTreeContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    id: string
    top: number
    left: number
  } | null>(null)

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
