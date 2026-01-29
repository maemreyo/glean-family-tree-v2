import { useEffect, useState, useCallback } from 'react'

interface UseFamilyTreeShortcutsProps {
  handleUndo: () => void
  handleRedo: () => void
  setFilterOpen: (open: boolean) => void
}

export function useFamilyTreeShortcuts({
  handleUndo,
  handleRedo,
  setFilterOpen,
}: UseFamilyTreeShortcutsProps) {
  const [isSpacePressed, setIsSpacePressed] = useState(false)

  const isEditableElement = useCallback((element: Element | null) => {
    if (!element) return false
    const tagName = element.tagName.toLowerCase()
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      (element as HTMLElement).isContentEditable
    )
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const isMod = event.ctrlKey || event.metaKey
      const isEditable = isEditableElement(document.activeElement)

      // Space key for panning (if implemented later or used by ReactFlow)
      if (key === ' ' && !isEditable) {
        event.preventDefault()
        if (!isSpacePressed) {
          setIsSpacePressed(true)
        }
        return
      }

      if (!isMod) return
      if (isEditable && key !== 'f') return

      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }

      if (key === 'f') {
        event.preventDefault()
        setFilterOpen(true)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === ' ') {
        setIsSpacePressed(false)
      }
    }

    const handleBlur = () => {
      setIsSpacePressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [handleRedo, handleUndo, isEditableElement, isSpacePressed, setFilterOpen])

  return {
    isSpacePressed,
  }
}
