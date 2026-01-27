// lib/supabase/realtime.ts
'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClientSupabase } from './client'
import { queryKeys } from './queries'
import type { Database } from '@/types/database.types'

type Person = Database['public']['Tables']['persons']['Row']

const supabase = createClientSupabase()

/**
 * Hook để subscribe realtime changes của persons table
 * 
 * ✅ Automatically updates React Query cache
 * ✅ Handles INSERT, UPDATE, DELETE events
 * ✅ Auto cleanup on unmount
 * 
 * Usage:
 * ```tsx
 * useRealtimePersons(userId)
 * ```
 */
export function useRealtimePersons(userId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`persons-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'persons',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Realtime event:', payload.eventType, payload)

          const queryKey = queryKeys.persons.byUser(userId)

          if (payload.eventType === 'INSERT') {
            // Add new person to cache
            queryClient.setQueryData<Person[]>(queryKey, (old) =>
              old ? [payload.new as Person, ...old] : [payload.new as Person]
            )

            // Also invalidate detail query if it exists
            queryClient.invalidateQueries({
              queryKey: queryKeys.persons.detail((payload.new as Person).id),
            })
          } else if (payload.eventType === 'UPDATE') {
            // Update person in cache
            queryClient.setQueryData<Person[]>(queryKey, (old) =>
              old
                ? old.map((person) =>
                    person.id === (payload.new as Person).id
                      ? (payload.new as Person)
                      : person
                  )
                : [payload.new as Person]
            )

            // Update detail query
            queryClient.setQueryData(
              queryKeys.persons.detail((payload.new as Person).id),
              payload.new as Person
            )
          } else if (payload.eventType === 'DELETE') {
            // Remove person from cache
            queryClient.setQueryData<Person[]>(queryKey, (old) =>
              old
                ? old.filter((person) => person.id !== (payload.old as Person).id)
                : []
            )

            // Remove detail query
            queryClient.removeQueries({
              queryKey: queryKeys.persons.detail((payload.old as Person).id),
            })
          }

          // Also invalidate family-specific queries if family_id exists
          const person = (payload.new || payload.old) as Person
          if (person.family_id) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.persons.byFamily(person.family_id),
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Unsubscribing from realtime channel')
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}

/**
 * Hook để subscribe realtime changes của một family cụ thể
 */
export function useRealtimeFamily(familyId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`family-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'persons',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log('🔔 Family realtime event:', payload.eventType)

          // Invalidate family queries để refetch
          queryClient.invalidateQueries({
            queryKey: queryKeys.persons.byFamily(familyId),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [familyId, queryClient])
}

/**
 * Hook để subscribe multiple tables cùng lúc
 * 
 * Usage:
 * ```tsx
 * useRealtimeMultiple(['persons', 'relationships'], userId)
 * ```
 */
export function useRealtimeMultiple(
  tables: string[],
  userId: string,
  onEvent?: (table: string, payload: any) => void
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channels = tables.map((table) => {
      const channel = supabase
        .channel(`${table}-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log(`🔔 ${table} event:`, payload.eventType)

            // Custom callback
            onEvent?.(table, payload)

            // Invalidate all queries cho table này
            queryClient.invalidateQueries({
              queryKey: [table],
            })
          }
        )
        .subscribe()

      return channel
    })

    // Cleanup all channels
    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel))
    }
  }, [tables.join(','), userId, queryClient, onEvent])
}

/**
 * Hook để check realtime connection status
 */
export function useRealtimeStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>(
    'disconnected'
  )

  useEffect(() => {
    const channel = supabase
      .channel('presence-check')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setStatus('error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return status
}
