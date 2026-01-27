import { notFound } from 'next/navigation'
import { getSharedTreeData } from '@/lib/supabase/admin'
import { ShareTreeClient } from './ShareTreeClient'
import { Metadata } from 'next'
import { PersonWithPhoto } from '@/types/app'

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  return {
    title: 'Shared Family Tree | Glean',
    description: 'View this shared family tree on Glean',
  }
}

export default async function SharedTreePage({ params }: Props) {
  const { token } = await params
  const data = await getSharedTreeData(token)

  if (!data) {
    notFound()
  }

  // Cast persons to PersonWithPhoto[] because Supabase types might be slightly different 
  // (e.g. nullability of joined fields) but we know the structure matches.
  const persons = data.persons as unknown as PersonWithPhoto[]
  const sanitizedPersons = persons.map((person) => {
    if (person.is_deceased) {
      return person
    }

    return {
      ...person,
      date_of_birth: null,
      date_of_death: null,
      birth_place: null,
      death_place: null,
      occupation: null,
      biography: null,
      notes: null,
      person_photos: [],
    }
  })

  return (
    <ShareTreeClient 
      userId={data.userId}
      persons={sanitizedPersons}
      relationships={data.relationships}
    />
  )
}
