'use client'

import { usePersons, useCreatePerson, useDeletePerson } from '@/lib/supabase/queries'
import { useRealtimeMultiple } from '@/lib/supabase/realtime'
import { useUIStore } from '@/providers/ui-store-provider'
import { useDashboardParams } from '@/lib/hooks/use-dashboard-params'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { PersonWithPhoto } from '@/types/app'
import { RelationshipModal } from '@/components/RelationshipModal'
import { PersonDetailSheet } from '@/components/PersonDetailSheet'
import { TreeSkeleton } from '@/components/skeletons/TreeSkeleton'
import { ListSkeleton } from '@/components/skeletons/ListSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { Trash2 } from 'lucide-react'

const FamilyTree = dynamic(() => import('@/components/dashboard/FamilyTree').then(mod => mod.FamilyTree), {
  ssr: false,
  loading: () => <TreeSkeleton />,
})

interface DashboardClientProps {
  userId: string
  userEmail: string
  initialPersons: PersonWithPhoto[]
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
const REALTIME_TABLES = ['persons', 'relationships']

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
  useRealtimeMultiple(REALTIME_TABLES, userId)

  // ============================================
  // URL State (Nuqs)
  // ============================================
  const { searchQuery, setSearchQuery, activeTab, setActiveTab } = useDashboardParams()

  // Filter persons based on search query
  const filteredPersons = persons.filter(person => 
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ============================================
  // Local Form State
  // ============================================
  const [newPersonName, setNewPersonName] = useState('')
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

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
      await deletePerson.mutateAsync({ id: personId, userId })
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
    <div className="flex h-screen overflow-hidden flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm dark:bg-gray-800 dark:border-gray-700 shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Family Tree</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Logged in as</p>
            <p className="text-sm font-bold">{userEmail}</p>
          </div>
        </div>
        
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

        {/* Action Bar */}
        <div className="flex items-center justify-between border-b bg-white px-6 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700 shrink-0 z-10">
          <h3 className="text-lg font-bold">
            {activeTab === 'tree' ? 'Family Tree Visualization' : 'Persons List'}
          </h3>
          
          <div className="flex items-center gap-4">
            {activeTab === 'list' && (
              <div className="relative w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search persons..."
                  className="w-full rounded-md border border-gray-300 px-4 py-1.5 pl-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="absolute left-3 top-2 text-gray-400 text-xs">🔍</span>
              </div>
            )}
            
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              <button
                onClick={() => setActiveTab('tree')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'tree'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Tree
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <main className={`flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 ${activeTab === 'list' ? 'overflow-y-auto p-6' : 'relative'}`}>
          <div className={`${activeTab === 'list' ? 'mx-auto max-w-6xl' : 'h-full w-full'}`}>
            
            {/* Content View */}
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <h3 className="mb-4 text-lg font-bold">Loading...</h3>
                  {activeTab === 'tree' ? <TreeSkeleton /> : <ListSkeleton />}
                </div>
              </div>
            ) : activeTab === 'tree' ? (
              <div className="h-full w-full">
                 <FamilyTree userId={userId} persons={persons} />
              </div>
            ) : (
              <div className="mb-8 w-full">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPersons.map((person) => (
                    <div 
                      key={person.id} 
                      className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                      onClick={() => openPersonModal(person.id)}
                    >
                      <div className="cursor-pointer">
                        <p className="font-semibold">{person.name}</p>
                        <p className="text-xs text-gray-500">ID: {person.id.slice(0, 8)}...</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePerson(person.id)
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {filteredPersons.length === 0 && (
                    <p className="col-span-full py-8 text-center text-gray-500">
                      No persons found matching &quot;{searchQuery}&quot;
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Create Person Form */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-bold">Add New Person</h3>
              <div className="flex gap-4">
                <input
                  id="new-person-input"
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
            {activeTab === 'list' && (
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Persons List ({persons.length})</h3>
                {isLoading && <span className="text-sm text-gray-500">Refreshing...</span>}
              </div>

              {error ? (
                <div className="text-red-500">Error loading persons</div>
              ) : persons.length === 0 ? (
                <EmptyState 
                  title="No family members yet" 
                  description="Get started by adding yourself or a family member above."
                  actionLabel="Add Person"
                  onAction={() => document.getElementById('new-person-input')?.focus()}
                />
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
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            )}
          </div>
        </main>

      <RelationshipModal
        isOpen={isRelationshipModalOpen}
        onClose={() => setIsRelationshipModalOpen(false)}
        persons={persons}
        userId={userId}
      />
      
      <PersonDetailSheet 
        persons={persons} 
        userId={userId}
        onAddRelative={() => setIsRelationshipModalOpen(true)}
      />
    </div>
  )
}
