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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out dark:bg-gray-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-center border-b px-4 dark:border-gray-700">
          <h1 className="text-xl font-bold">Family Tree</h1>
        </div>
        <nav className="p-4">
          <div className="mb-4 rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Logged in as:
            </p>
            <p className="truncate text-sm font-bold">{userEmail}</p>
          </div>
          
          <button
            onClick={toggleSidebar}
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 lg:hidden"
          >
            Close Sidebar
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <button
            onClick={toggleSidebar}
            className="rounded-md p-2 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-700"
          >
            ☰
          </button>
          <h2 className="text-lg font-semibold">Dashboard</h2>
          
          {/* Toast Notification */}
          {toast.visible && (
            <div
              className={`absolute right-4 top-20 z-50 rounded-md px-4 py-2 text-white shadow-lg ${
                toast.type === 'success'
                  ? 'bg-green-500'
                  : toast.type === 'error'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
            >
              {toast.message}
            </div>
          )}
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-900">
          <div className="mx-auto max-w-4xl">
            {/* Create Person Form */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-bold">Add New Person</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Enter name..."
                  className="flex-1 rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePerson()}
                />
                <button
                  onClick={handleCreatePerson}
                  disabled={createPerson.isPending}
                  className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createPerson.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>

            {/* Persons List */}
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Persons List ({persons.length})</h3>
                {isLoading && <span className="text-sm text-gray-500">Refreshing...</span>}
              </div>

              {error ? (
                <div className="text-red-500">Error loading persons</div>
              ) : persons.length === 0 ? (
                <p className="text-gray-500">No persons found. Add one above!</p>
              ) : (
                <ul className="divide-y dark:divide-gray-700">
                  {persons.map((person) => (
                    <li
                      key={person.id}
                      className={`flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 rounded-md transition-colors ${
                        selectedPersonId === person.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => openPersonModal(person.id)}
                      >
                        <p className="font-medium">{person.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(person.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPersonId === person.id && (
                          <span className="text-xs text-blue-500 font-medium px-2 py-1 bg-blue-100 rounded-full dark:bg-blue-900">
                            Selected
                          </span>
                        )}
                        <button
                          onClick={() => handleDeletePerson(person.id)}
                          className="rounded-md p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          disabled={deletePerson.isPending}
                        >
                          🗑️
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
