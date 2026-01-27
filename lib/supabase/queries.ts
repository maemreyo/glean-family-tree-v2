// lib/supabase/queries.ts
'use client'

import { createClientSupabase } from './client'
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type { Database } from '@/types/database.types'

type Person = Database['public']['Tables']['persons']['Row']
type PersonInsert = Database['public']['Tables']['persons']['Insert']
type PersonUpdate = Database['public']['Tables']['persons']['Update']

type Relationship = Database['public']['Tables']['relationships']['Row']
type RelationshipInsert = Database['public']['Tables']['relationships']['Insert']

const supabase = createClientSupabase()

/**
 * Query Keys - Centralized để dễ invalidate
 */
export const queryKeys = {
  persons: {
    all: ['persons'] as const,
    byUser: (userId: string) => ['persons', 'user', userId] as const,
    byFamily: (familyId: string) => ['persons', 'family', familyId] as const,
    detail: (id: string) => ['persons', 'detail', id] as const,
  },
  relationships: {
    all: ['relationships'] as const,
    byUser: (userId: string) => ['relationships', 'user', userId] as const,
    byFamily: (familyId: string) =>
      ['relationships', 'family', familyId] as const,
  },
}

// ============================================
// PERSONS QUERIES
// ============================================

/**
 * Fetch all persons của user hiện tại
 */
export function usePersons(
  userId: string,
  options?: Omit<UseQueryOptions<Person[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.persons.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    ...options,
  })
}

/**
 * Fetch persons của một family cụ thể
 */
export function usePersonsByFamily(
  familyId: string,
  options?: Omit<UseQueryOptions<Person[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.persons.byFamily(familyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('family_id', familyId)
        .order('name', { ascending: true })

      if (error) throw error
      return data
    },
    ...options,
  })
}

/**
 * Fetch chi tiết 1 person
 */
export function usePerson(
  personId: string,
  options?: Omit<UseQueryOptions<Person | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.persons.detail(personId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('id', personId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }
      return data
    },
    ...options,
  })
}

// ============================================
// PERSONS MUTATIONS
// ============================================

/**
 * Create person mới
 */
export function useCreatePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (person: PersonInsert) => {
      const { data, error } = await supabase
        .from('persons')
        .insert(person)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (newPerson) => {
      // Invalidate all persons queries
      queryClient.invalidateQueries({ queryKey: queryKeys.persons.all })

      // Optimistic update cho specific queries
      queryClient.setQueryData<Person[]>(
        queryKeys.persons.byUser(newPerson.user_id),
        (old) => (old ? [newPerson, ...old] : [newPerson])
      )
    },
  })
}

/**
 * Update person
 */
export function useUpdatePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: PersonUpdate
    }) => {
      const { data, error } = await supabase
        .from('persons')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.persons.detail(id) })

      // Snapshot previous value
      const previousPerson = queryClient.getQueryData<Person>(
        queryKeys.persons.detail(id)
      )

      // Optimistically update detail
      if (previousPerson) {
        queryClient.setQueryData<Person>(queryKeys.persons.detail(id), {
          ...previousPerson,
          ...updates,
        })
      }

      return { previousPerson }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousPerson) {
        queryClient.setQueryData(
          queryKeys.persons.detail(id),
          context.previousPerson
        )
      }
    },
    onSuccess: (updatedPerson) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.persons.all })
    },
  })
}

/**
 * Delete person
 */
export function useDeletePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', personId)

      if (error) throw error
      return personId
    },
    onSuccess: (deletedId) => {
      // Remove from all caches
      queryClient.invalidateQueries({ queryKey: queryKeys.persons.all })

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: queryKeys.persons.detail(deletedId) })
    },
  })
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Create multiple persons at once
 */
export function useCreatePersonsBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (persons: PersonInsert[]) => {
      const { data, error } = await supabase
        .from('persons')
        .insert(persons)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate all persons queries
      queryClient.invalidateQueries({ queryKey: queryKeys.persons.all })
    },
  })
}

// ============================================
// RELATIONSHIPS QUERIES
// ============================================

export function useRelationships(
  userId: string,
  options?: Omit<UseQueryOptions<Relationship[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.relationships.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      return data
    },
    ...options,
  })
}

// ============================================
// RELATIONSHIPS MUTATIONS
// ============================================

export function useCreateRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (relationship: RelationshipInsert) => {
      const { data, error } = await supabase
        .from('relationships')
        .insert(relationship)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (newRel) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationships.byUser(newRel.user_id),
      })
    },
  })
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationships.all,
      })
    },
  })
}
