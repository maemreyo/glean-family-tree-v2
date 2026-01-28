import { useCallback, useEffect, useRef, useState } from 'react'

export function useEdgeHover(delayMs = 200) {
  const [isHovered, setIsHovered] = useState(false)
  const hoverTimeoutRef = useRef<number | null>(null)

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [])

  const handleEnter = useCallback(() => {
    clearHoverTimeout()
    setIsHovered(true)
  }, [clearHoverTimeout])

  const handleLeave = useCallback(() => {
    clearHoverTimeout()
    hoverTimeoutRef.current = window.setTimeout(() => setIsHovered(false), delayMs)
  }, [clearHoverTimeout, delayMs])

  useEffect(() => {
    return () => {
      clearHoverTimeout()
    }
  }, [clearHoverTimeout])

  return { isHovered, handleEnter, handleLeave }
}
