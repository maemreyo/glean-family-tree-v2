'use client'

import { useState } from 'react'
import { useCreateRelationship } from '@/lib/supabase/queries'
import { useUIStore } from '@/providers/ui-store-provider'
import type { Database } from '@/types/database.types'

type Person = Database['public']['Tables']['persons']['Row']

interface RelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  persons: Person[]
  userId: string
}

export function RelationshipModal({
  isOpen,
  onClose,
  persons,
  userId,
}: RelationshipModalProps) {
  const [parentId, setParentId] = useState('')
  const [childId, setChildId] = useState('')
  const createRelationship = useCreateRelationship()
  const showToast = useUIStore((state) => state.showToast)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!parentId || !childId) {
      showToast('Please select both parent and child', 'error')
      return
    }

    if (parentId === childId) {
      showToast('Parent and child cannot be the same person', 'error')
      return
    }

    try {
      await createRelationship.mutateAsync({
        parent_id: parentId,
        child_id: childId,
        user_id: userId,
      })
      showToast('Relationship created successfully!', 'success')
      onClose()
      setParentId('')
      setChildId('')
    } catch (error) {
      console.error('Error creating relationship:', error)
      showToast('Failed to create relationship', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-bold">Add Relationship</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Parent</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select Parent</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Child</label>
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select Child</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRelationship.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createRelationship.isPending ? 'Saving...' : 'Save Relationship'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
