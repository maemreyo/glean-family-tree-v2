import { useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { parseGedcom, parseGedcomDate } from '@/lib/gedcom'
import { getErrorMessage } from '@/lib/utils'

interface UseFamilyTreeImportProps {
  userId: string
}

export function useFamilyTreeImport({ userId }: UseFamilyTreeImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonFileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleImportGedcom = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const loadingToast = toast.loading('Importing GEDCOM...')

    try {
      const text = await file.text()
      const { persons: gedPersons, families: gedFamilies } = parseGedcom(text)

      const idMap = new Map<string, string>()

      const newPersons = gedPersons.map(p => {
        const uuid = crypto.randomUUID()
        idMap.set(p.id, uuid)
        return {
          id: uuid,
          user_id: userId,
          name: p.name || 'Unknown',
          gender: p.gender || 'other',
          birth_place: p.birthPlace,
          death_place: p.deathPlace,
          occupation: p.occupation,
          notes: p.notes,
          date_of_birth: parseGedcomDate(p.birthDate),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      const newRelationships: any[] = []
      gedFamilies.forEach(fam => {
        const husbId = fam.husb ? idMap.get(fam.husb) : null
        const wifeId = fam.wife ? idMap.get(fam.wife) : null

        if (husbId && wifeId) {
          newRelationships.push({
            id: crypto.randomUUID(),
            user_id: userId,
            from_person_id: husbId,
            to_person_id: wifeId,
            type: 'spouse',
            created_at: new Date().toISOString()
          })
        }

        const parentId = husbId || wifeId
        if (parentId) {
          fam.children.forEach(childGedId => {
            const childId = idMap.get(childGedId)
            if (childId) {
              newRelationships.push({
                id: crypto.randomUUID(),
                user_id: userId,
                from_person_id: parentId,
                to_person_id: childId,
                type: 'parent',
                created_at: new Date().toISOString()
              })
            }
          })
        }
      })

      if (newPersons.length > 0) {
        const { error: pError } = await supabase.from('persons').insert(newPersons)
        if (pError) throw pError
      }

      if (newRelationships.length > 0) {
        const { error: rError } = await supabase.from('relationships').insert(newRelationships)
        if (rError) throw rError
      }

      toast.dismiss(loadingToast)
      toast.success(`Imported ${newPersons.length} persons and ${newRelationships.length} relationships.`)

      if (fileInputRef.current) fileInputRef.current.value = ''
      window.location.reload()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toast.error('Import Failed: ' + getErrorMessage(error))
    }
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmRestore = window.confirm(
      'This will replace your current persons, relationships, photos, and life events. Continue?'
    )
    if (!confirmRestore) {
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = ''
      return
    }

    const loadingToast = toast.loading('Restoring JSON backup...')

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data?.persons) || !Array.isArray(data?.relationships)) {
        throw new Error('Invalid backup file')
      }

      const personsData = data.persons ?? []
      const relationshipsData = data.relationships ?? []
      const photosData = data.person_photos ?? []
      const eventsData = data.life_events ?? []
      const now = new Date().toISOString()

      const personsPayload = personsData.map((person: any) => ({
        id: person.id,
        user_id: userId,
        name: person.name,
        gender: person.gender ?? null,
        date_of_birth: person.date_of_birth ?? null,
        is_deceased: person.is_deceased ?? null,
        date_of_death: person.date_of_death ?? null,
        nickname: person.nickname ?? null,
        birth_place: person.birth_place ?? null,
        death_place: person.death_place ?? null,
        occupation: person.occupation ?? null,
        biography: person.biography ?? null,
        notes: person.notes ?? null,
        position_x: person.position_x ?? null,
        position_y: person.position_y ?? null,
        family_id: person.family_id ?? null,
        is_visible_in_share: person.is_visible_in_share ?? true,
        created_at: person.created_at ?? now,
        updated_at: person.updated_at ?? now,
      }))

      const relationshipsPayload = relationshipsData.map((relationship: any) => ({
        id: relationship.id,
        user_id: userId,
        from_person_id: relationship.from_person_id ?? relationship.parent_id,
        to_person_id: relationship.to_person_id ?? relationship.child_id,
        source_handle: relationship.source_handle ?? null,
        target_handle: relationship.target_handle ?? null,
        type: relationship.type || relationship.relationship_type,
        created_at: relationship.created_at ?? now,
      }))

      const photosPayload = photosData.map((photo: any) => ({
        id: photo.id,
        person_id: photo.person_id,
        url: photo.url,
        user_id: userId,
        is_profile_picture: photo.is_profile_picture ?? null,
        description: photo.description ?? null,
        created_at: photo.created_at ?? now,
      }))

      const eventsPayload = eventsData.map((event: any) => ({
        id: event.id,
        person_id: event.person_id,
        user_id: userId,
        title: event.title,
        event_type: event.event_type,
        date: event.date ?? null,
        description: event.description ?? null,
        location: event.location ?? null,
        created_at: event.created_at ?? now,
      }))

      // Delete existing data
      const deleteResults = await Promise.all([
        supabase.from('relationships').delete().eq('user_id', userId),
        supabase.from('life_events').delete().eq('user_id', userId),
        supabase.from('person_photos').delete().eq('user_id', userId),
      ])

      for (const result of deleteResults) {
        if (result.error) throw result.error
      }

      const deletePersonsResult = await supabase.from('persons').delete().eq('user_id', userId)
      if (deletePersonsResult.error) throw deletePersonsResult.error

      // Insert new data
      if (personsPayload.length > 0) {
        const { error } = await supabase.from('persons').insert(personsPayload)
        if (error) throw error
      }

      if (relationshipsPayload.length > 0) {
        const { error } = await supabase.from('relationships').insert(relationshipsPayload)
        if (error) throw error
      }

      if (photosPayload.length > 0) {
        const { error } = await supabase.from('person_photos').insert(photosPayload)
        if (error) throw error
      }

      if (eventsPayload.length > 0) {
        const { error } = await supabase.from('life_events').insert(eventsPayload)
        if (error) throw error
      }

      toast.dismiss(loadingToast)
      toast.success('JSON backup restored')
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = ''
      window.location.reload()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toast.error('Restore Failed: ' + getErrorMessage(error))
    }
  }

  const triggerImport = () => fileInputRef.current?.click()
  const triggerImportJson = () => jsonFileInputRef.current?.click()

  return {
    fileInputRef,
    jsonFileInputRef,
    handleImportGedcom,
    handleImportJson,
    triggerImport,
    triggerImportJson,
  }
}
