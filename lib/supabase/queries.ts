'use client'

import { createClientSupabase } from './client'
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type { Database } from '@/types/database.types'
import type { PersonWithPhoto } from '@/types/app'

type Person = Database['public']['Tables']['persons']['Row']
type PersonInsert = Database['public']['Tables']['persons']['Insert']
type PersonUpdate = Database['public']['Tables']['persons']['Update']

type Relationship = Database['public']['Tables']['relationships']['Row']
type RelationshipInsert = Database['public']['Tables']['relationships']['Insert']
type RelationshipUpdate = Database['public']['Tables']['relationships']['Update']

type PersonPhoto = Database['public']['Tables']['person_photos']['Row']
type PersonPhotoInsert = Database['public']['Tables']['person_photos']['Insert']

type LifeEvent = Database['public']['Tables']['life_events']['Row']
type LifeEventInsert = Database['public']['Tables']['life_events']['Insert']
type LifeEventUpdate = Database['public']['Tables']['life_events']['Update']

type SharedLink = Database['public']['Tables']['shared_links']['Row']
type SharedLinkInsert = Database['public']['Tables']['shared_links']['Insert']

const supabase = createClientSupabase()

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
  photos: {
    byPerson: (personId: string) => ['photos', 'person', personId] as const,
  },
  lifeEvents: {
    byPerson: (personId: string) => ['lifeEvents', 'person', personId] as const,
  },
  sharedLinks: {
    byUser: (userId: string) => ['sharedLinks', 'user', userId] as const,
  },
}

// ============================================
// PERSONS QUERIES
// ============================================

export function usePersons(
  userId: string,
  options?: Omit<UseQueryOptions<PersonWithPhoto[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.persons.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('*, person_photos(url, is_profile_picture)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as PersonWithPhoto[]
    },
    ...options,
  })
}

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

export function usePerson(
  id: string,
  options?: Omit<UseQueryOptions<Person>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.persons.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
    ...options,
  })
}

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.persons.byUser(newPerson.user_id),
      })
      if (newPerson.family_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.persons.byFamily(newPerson.family_id),
        })
      }
    },
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: PersonUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('persons')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (updatedPerson) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.persons.byUser(updatedPerson.user_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.persons.detail(updatedPerson.id),
      })
      if (updatedPerson.family_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.persons.byFamily(updatedPerson.family_id),
        })
      }
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from('persons').delete().eq('id', id)
      if (error) throw error
      return { id, userId }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.persons.byUser(userId),
      })
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

export function useUpdateRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: RelationshipUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('relationships')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (updatedRel) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationships.byUser(updatedRel.user_id),
      })
    },
  })
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, userId }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationships.byUser(userId),
      })
    },
  })
}

// ============================================
// PHOTOS QUERIES
// ============================================

export function usePersonPhotos(personId: string) {
  return useQuery({
    queryKey: queryKeys.photos.byPerson(personId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('person_photos')
        .select('*')
        .eq('person_id', personId)
        .order('is_profile_picture', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!personId,
  })
}

export function useUploadPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      personId,
      userId,
    }: {
      file: File
      personId: string
      userId: string
    }) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${userId}/${personId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('photos').getPublicUrl(filePath)

      const { data, error } = await supabase
        .from('person_photos')
        .insert({
          person_id: personId,
          url: publicUrl,
          user_id: userId,
          is_profile_picture: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.photos.byPerson(personId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.persons.byUser(_.user_id),
      })
    },
  })
}

export function useDeletePhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ photoId }: { photoId: string }) => {
      const { error } = await supabase
        .from('person_photos')
        .delete()
        .eq('id', photoId)

      if (error) throw error
      return photoId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}

export function useSetProfilePicture() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      photoId,
      personId,
      userId,
    }: {
      photoId: string
      personId: string
      userId: string
    }) => {
      // 1. Set all photos of this person to is_profile_picture = false
      await supabase
        .from('person_photos')
        .update({ is_profile_picture: false })
        .eq('person_id', personId)

      // 2. Set the selected photo to true
      const { data, error } = await supabase
        .from('person_photos')
        .update({ is_profile_picture: true })
        .eq('id', photoId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.photos.byPerson(data.person_id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.persons.byUser(data.user_id),
      })
    },
  })
}

// ============================================
// LIFE EVENTS QUERIES
// ============================================

export function useLifeEvents(personId: string) {
  return useQuery({
    queryKey: queryKeys.lifeEvents.byPerson(personId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('person_id', personId)
        .order('date', { ascending: true })

      if (error) throw error
      return data as LifeEvent[]
    },
    enabled: !!personId,
  })
}

export function useCreateLifeEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (event: LifeEventInsert) => {
      const { data, error } = await supabase
        .from('life_events')
        .insert(event)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lifeEvents.byPerson(newEvent.person_id),
      })
    },
  })
}

export function useUpdateLifeEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: LifeEventUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('life_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lifeEvents.byPerson(updatedEvent.person_id),
      })
    },
  })
}

export function useDeleteLifeEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, personId }: { id: string; personId: string }) => {
      const { error } = await supabase
        .from('life_events')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, personId }
    },
    onSuccess: ({ personId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lifeEvents.byPerson(personId),
      })
    },
  })
}

// ============================================
// SHARED LINKS QUERIES
// ============================================

export function useSharedLinks(userId: string) {
  return useQuery({
    queryKey: queryKeys.sharedLinks.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as SharedLink[]
    },
    enabled: !!userId,
  })
}

export function useCreateSharedLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (link: SharedLinkInsert) => {
      const { data, error } = await supabase
        .from('shared_links')
        .insert(link)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (newLink) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedLinks.byUser(newLink.user_id),
      })
    },
  })
}

export function useDeleteSharedLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('shared_links')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, userId }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedLinks.byUser(userId),
      })
    },
  })
}
