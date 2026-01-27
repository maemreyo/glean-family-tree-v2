// app/dashboard/DashboardClient.tsx
'use client'

import { usePersons, useCreatePerson, useDeletePerson } from '@/lib/supabase/queries'
import { useRealtimePersons } from '@/lib/supabase/realtime'
import { useUIStore } from '@/providers/ui-store-provider'
import { useState } from 'react'
import type { Database } from '@/types/database.types'

type Person = Database['public']['Tables']['persons']['Row']

interface DashboardClientProps {
  userId: string
  userEmail: string
  initialPersons: Person[]
}

/**
 * Dashboard Client Component
 * 
 * ✅ Demonstrates:
 * - React Query với initialData
 * - Zustand UI state
 * - Realtime subscriptions
 * - Optimistic updates
 * - Loading states
 * - Error handling
 */
export function DashboardClient({
  userId,
  userEmail,
  initialPersons,
}: DashboardClientProps) {
  // ============================================
  // React Query - Server Data
  // ============================================
  const {
    data: persons = initialPersons,
    isLoading,
    error,
  } = usePersons(userId, {
    initialData: initialPersons,
  })

  const createPerson = useCreatePerson()
  const deletePerson = useDeletePerson()

  // ============================================
  // Zustand - UI State
  // ============================================
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const openPersonModal = useUIStore((state) => state.openPersonModal)
  const selectedPersonId = useUIStore((state) => state.selectedPersonId)
  const showToast = useUIStore((state) => state.showToast)
  const toast = useUIStore((state) => state.toast)

  // ============================================
  // Realtime Subscriptions
  // ============================================
  useRealtimePersons(userId)

  // ============================================
  // Local Form State
  // ============================================
  const [newPersonName, setNewPersonName] = useState('')

  // ============================================
  // Handlers
  // ============================================
  const handleCreatePerson = async () => {
    if (!newPersonName.trim()) {
      showToast('Name is required', 'error')
      return
    }

    try {
      await createPerson.mutateAsync({
        name: newPersonName,
        user_id: userId,
      })

      setNewPersonName('')
      showToast('Person created successfully!', 'success')
    } catch (error) {
      console.error('Error creating person:', error)
      showToast('Failed to create person', 'error')
    }
  }

  const handleDeletePerson = async (personId: string) => {
    if (!confirm('Are you sure you want to delete this person?')) {
      return
    }

    try {
      await deletePerson.mutateAsync(personId)
      showToast('Person deleted successfully!', 'success')
    } catch (error) {
      console.error('Error deleting person:', error)
      showToast('Failed to delete person', 'error')
    }
  }

  // ============================================
  // Render
  // ============================================
  return (
    <div className="flex h-screen">
      {/* Sidebar - Controlled by Zustand */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-white border-r overflow-hidden`}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Sidebar</h2>
          <p className="text-sm text-gray-600">User: {userEmail}</p>
          <p className="text-sm text-gray-600 mt-2">
            Total persons: {persons.length}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>

            <div className="flex items-center gap-2">
              {isLoading && (
                <span className="text-sm text-gray-500">Loading...</span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Toast Notification - Controlled by Zustand */}
          {toast.visible && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                toast.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : toast.type === 'error'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              {toast.message}
            </div>
          )}

          {/* Create Person Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Person</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Enter name..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCreatePerson()
                }}
              />
              <button
                onClick={handleCreatePerson}
                disabled={createPerson.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createPerson.isPending ? 'Creating...' : 'Add Person'}
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">Error loading persons: {error.message}</p>
            </div>
          )}

          {/* Persons List - Data from React Query */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Persons List</h2>
              <p className="text-sm text-gray-600">
                {persons.length} person{persons.length !== 1 ? 's' : ''} total
              </p>
            </div>

            {persons.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">No persons yet. Add one above!</p>
              </div>
            ) : (
              <div className="divide-y">
                {persons.map((person) => (
                  <div
                    key={person.id}
                    className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{person.name}</h3>
                      <p className="text-sm text-gray-600">
                        {person.date_of_birth || 'No date of birth'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openPersonModal(person.id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeletePerson(person.id)}
                        disabled={deletePerson.isPending}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        {deletePerson.isPending &&
                        deletePerson.variables === person.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs font-mono">
              <p>Selected Person ID: {selectedPersonId || 'none'}</p>
              <p>Sidebar Open: {sidebarOpen ? 'true' : 'false'}</p>
              <p>Persons Count: {persons.length}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
