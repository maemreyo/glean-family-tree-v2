
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PrintProfileClient } from './PrintProfileClient'
import { Database } from '@/types/database.types'

type Person = Database['public']['Tables']['persons']['Row'] & {
  person_photos: { url: string; is_profile_picture: boolean }[]
}

type LifeEvent = Database['public']['Tables']['life_events']['Row']

interface RelationshipWithPerson {
  related_person: Person
  type: 'parent' | 'child' | 'spouse'
}

export default async function PrintProfilePage({
  params,
}: {
  params: Promise<{ personId: string }>
}) {
  const { personId } = await params
  const supabase = await createServerSupabase()

  // 1. Check Auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch Person Details & Photos
  const { data: person, error: personError } = await supabase
    .from('persons')
    .select('*, person_photos(url, is_profile_picture)')
    .eq('id', personId)
    .eq('user_id', user.id)
    .single()

  if (personError || !person) {
    notFound()
  }

  // 3. Fetch Life Events
  const { data: lifeEvents } = await supabase
    .from('life_events')
    .select('*')
    .eq('person_id', personId)
    .order('date', { ascending: true })

  // 4. Fetch Relationships to determine Family
  // We need to fetch all relationships involving this person to build the family list
  const { data: relationships } = await supabase
    .from('relationships')
    .select('*')
    .or(`parent_id.eq.${personId},child_id.eq.${personId}`)

  // To get the names of related people, we need to fetch them.
  // Collect all related IDs
  const relatedIds = new Set<string>()
  relationships?.forEach((r) => {
    if (r.parent_id !== personId) relatedIds.add(r.parent_id)
    if (r.child_id !== personId) relatedIds.add(r.child_id)
  })

  let relatedPersons: Person[] = []
  if (relatedIds.size > 0) {
    const { data } = await supabase
      .from('persons')
      .select('*, person_photos(url, is_profile_picture)')
      .in('id', Array.from(relatedIds))
    
    if (data) relatedPersons = data
  }

  // Process relationships into a friendly format
  const familyMembers: RelationshipWithPerson[] = []

  relationships?.forEach((r) => {
    if (r.relationship_type === 'spouse') {
        const spouseId = r.parent_id === personId ? r.child_id : r.parent_id
        const spouse = relatedPersons.find(p => p.id === spouseId)
        if (spouse) familyMembers.push({ related_person: spouse, type: 'spouse' })
    } else if (r.relationship_type === 'parent') {
        if (r.child_id === personId) {
            // This relationship means r.parent_id is the PARENT of current person
            const parent = relatedPersons.find(p => p.id === r.parent_id)
            if (parent) familyMembers.push({ related_person: parent, type: 'parent' })
        } else {
             // This relationship means r.parent_id is the current person, so r.child_id is the CHILD
             const child = relatedPersons.find(p => p.id === r.child_id)
             if (child) familyMembers.push({ related_person: child, type: 'child' })
        }
    }
  })

  // Typed person with photos
  const personWithPhotos = person as Person

  return (
    <PrintProfileClient 
      person={personWithPhotos} 
      lifeEvents={lifeEvents || []} 
      familyMembers={familyMembers}
    />
  )
}
