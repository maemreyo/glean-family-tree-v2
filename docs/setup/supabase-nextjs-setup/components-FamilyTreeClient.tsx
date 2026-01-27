// components/FamilyTreeClient.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientSupabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Person = Database['public']['Tables']['persons']['Row']

interface FamilyTreeClientProps {
  initialData: Person[]
  userId: string
}

/**
 * Example: Client Component với Realtime Subscriptions
 * 
 * ✅ Best Practices:
 * - Nhận initialData từ Server Component (tránh loading state)
 * - Setup realtime subscription trong useEffect
 * - Cleanup subscription khi unmount
 * - Optimistic updates cho UX tốt hơn
 */
export function FamilyTreeClient({ initialData, userId }: FamilyTreeClientProps) {
  const [persons, setPersons] = useState<Person[]>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientSupabase()

  // Setup Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('family-tree-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'persons',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime change received:', payload)

          if (payload.eventType === 'INSERT') {
            setPersons((current) => [payload.new as Person, ...current])
          } else if (payload.eventType === 'UPDATE') {
            setPersons((current) =>
              current.map((person) =>
                person.id === payload.new.id ? (payload.new as Person) : person
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setPersons((current) =>
              current.filter((person) => person.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Example mutation: Add person
  const handleAddPerson = async (name: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('persons')
        .insert({
          name,
          user_id: userId,
        })
        .select()
        .single()

      if (error) throw error

      // Optimistic update (nếu không dùng realtime)
      // setPersons((current) => [data, ...current])
      
      // Với realtime, không cần update manually - subscription sẽ handle
    } catch (error) {
      console.error('Error adding person:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => handleAddPerson('New Person')}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add Person'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {persons.map((person) => (
          <div key={person.id} className="p-4 border rounded-lg">
            <h3 className="font-semibold">{person.name}</h3>
            <p className="text-sm text-gray-600">ID: {person.id}</p>
          </div>
        ))}
      </div>

      {persons.length === 0 && (
        <p className="text-gray-500 text-center py-8">No persons yet. Add one to get started!</p>
      )}
    </div>
  )
}
