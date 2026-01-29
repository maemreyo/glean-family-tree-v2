import { useEffect, useState } from 'react'

interface ThemeColors {
  spouse: string
  spouseBg: string
  spouseHeartBg: string
  spouseHeartBorder: string
  spouseHeartIcon: string
  parent: string
  parentBg: string
  parentWidth: string
  spouseWidth: string
  spouseBgWidth: string
  hitboxWidth: string
}

export function useThemeColors() {
  const [colors, setColors] = useState<ThemeColors>({
    spouse: 'var(--relationship-spouse)',
    spouseBg: 'var(--relationship-spouse-bg)',
    spouseHeartBg: 'var(--spouse-heart-bg)',
    spouseHeartBorder: 'var(--spouse-heart-border)',
    spouseHeartIcon: 'var(--spouse-heart-icon)',
    parent: 'var(--relationship-parent)',
    parentBg: 'var(--relationship-spouse-bg)', // Using same bg for now if parent bg var missing
    parentWidth: 'var(--edge-parent-width)',
    spouseWidth: 'var(--edge-spouse-width)',
    spouseBgWidth: 'var(--edge-spouse-bg-width)',
    hitboxWidth: 'var(--edge-hitbox-width)',
  })

  useEffect(() => {
    // Function to update colors
    const updateColors = () => {
      // Create a dummy element to resolve CSS variables to computed values (rgb)
      // This ensures that libraries like html-to-image can capture the correct colors
      // even if they struggle with oklch() or CSS variables in certain contexts.
      const el = document.createElement('div')
      el.style.visibility = 'hidden'
      el.style.position = 'absolute'
      el.style.pointerEvents = 'none'
      document.body.appendChild(el)

      const resolveColor = (variable: string) => {
        el.style.color = `var(${variable})`
        const value = getComputedStyle(el).color
        return value && value !== '' ? value : `var(${variable})`
      }

      const styles = getComputedStyle(document.documentElement)
      const getValue = (name: string) => styles.getPropertyValue(name).trim() || `var(${name})`

      setColors({
        spouse: resolveColor('--relationship-spouse'),
        spouseBg: resolveColor('--relationship-spouse-bg'),
        spouseHeartBg: resolveColor('--spouse-heart-bg'),
        spouseHeartBorder: resolveColor('--spouse-heart-border'),
        spouseHeartIcon: resolveColor('--spouse-heart-icon'),
        parent: resolveColor('--relationship-parent'),
        parentBg: resolveColor('--relationship-spouse-bg'), // Fallback
        parentWidth: getValue('--edge-parent-width'),
        spouseWidth: getValue('--edge-spouse-width'),
        spouseBgWidth: getValue('--edge-spouse-bg-width'),
        hitboxWidth: getValue('--edge-hitbox-width'),
      })

      document.body.removeChild(el)
    }

    updateColors()

    // Observe class changes on html element (for theme switching)
    const observer = new MutationObserver(updateColors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    return () => observer.disconnect()
  }, [])

  return colors
}
