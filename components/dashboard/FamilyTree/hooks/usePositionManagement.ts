import { useCallback, useRef } from 'react'
import { Node } from 'reactflow'
import { useUpdatePerson } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'

interface UsePositionManagementProps {
  readOnly?: boolean
}

export function usePositionManagement({ readOnly = false }: UsePositionManagementProps) {
  const { mutate: updatePerson } = useUpdatePerson()
  const supabase = createClient()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced single node position save
  const saveNodePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (readOnly) return

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        updatePerson({
          id: nodeId,
          position_x: x,
          position_y: y,
        })
      }, 500)
    },
    [updatePerson, readOnly]
  )

  // Batch update multiple positions
  const batchSavePositions = useCallback(
    async (nodes: Node[]) => {
      if (readOnly) return

      const updates = nodes.map(node => ({
        id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
        updated_at: new Date().toISOString(),
      }))

      try {
        const { error } = await supabase
          .from('persons')
          .upsert(updates, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })

        if (error) throw error
      } catch (error) {
        console.error('Failed to batch save positions:', error)
        throw error
      }
    },
    [supabase, readOnly]
  )

  // Immediate save (for critical operations)
  const saveNodePositionImmediate = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (readOnly) return

      // Cancel any pending debounced save
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      updatePerson({
        id: nodeId,
        position_x: x,
        position_y: y,
      })
    },
    [updatePerson, readOnly]
  )

  return {
    saveNodePosition,
    saveNodePositionImmediate,
    batchSavePositions,
  }
}
