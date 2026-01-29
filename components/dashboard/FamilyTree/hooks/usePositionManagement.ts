import { useCallback, useRef } from 'react'
import { Node } from 'reactflow'
import { useUpdatePerson } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'
import { getErrorMessage } from '@/lib/utils'

interface UsePositionManagementProps {
  readOnly?: boolean
  userId: string
}

export function usePositionManagement({ readOnly = false, userId }: UsePositionManagementProps) {
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

      try {
        const updatedAt = new Date().toISOString()
        await Promise.all(
          nodes.map(async (node) => {
            const { error } = await supabase
              .from('persons')
              .update({
                position_x: node.position.x,
                position_y: node.position.y,
                updated_at: updatedAt,
              })
              .eq('id', node.id)
              .eq('user_id', userId)

            if (error) throw error
          })
        )
      } catch (error) {
        const message = getErrorMessage(error)
        console.error('Failed to batch save positions:', message)
        throw new Error(message)
      }
    },
    [supabase, readOnly, userId]
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
