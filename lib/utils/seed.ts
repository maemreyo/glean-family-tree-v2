import { createClientSupabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type PersonInsert = Database['public']['Tables']['persons']['Insert']
type RelationshipInsert = Database['public']['Tables']['relationships']['Insert']

const supabase = createClientSupabase()

export async function seedMockData(userId: string) {
  try {
    // 1. Create Grandparents
    const grandparentsData: PersonInsert[] = [
      { name: 'Grandpa John', user_id: userId, gender: 'male', date_of_birth: '1950-01-01' },
      { name: 'Grandma Mary', user_id: userId, gender: 'female', date_of_birth: '1955-05-15' },
    ]
    
    const { data: grandparents, error: gpError } = await supabase
      .from('persons')
      .insert(grandparentsData)
      .select()

    if (gpError) throw gpError
    if (!grandparents) throw new Error('Failed to create grandparents')

    // 2. Create Parents
    const parentsData: PersonInsert[] = [
      { name: 'Dad Robert', user_id: userId, gender: 'male', date_of_birth: '1980-03-10' },
      { name: 'Mom Sarah', user_id: userId, gender: 'female', date_of_birth: '1982-07-20' },
    ]

    const { data: parents, error: pError } = await supabase
      .from('persons')
      .insert(parentsData)
      .select()

    if (pError) throw pError
    if (!parents) throw new Error('Failed to create parents')

    // 3. Create Children
    const childrenData: PersonInsert[] = [
      { name: 'Son Mike', user_id: userId, gender: 'male', date_of_birth: '2010-06-01' },
      { name: 'Daughter Emma', user_id: userId, gender: 'female', date_of_birth: '2012-09-15' },
    ]

    const { data: children, error: cError } = await supabase
      .from('persons')
      .insert(childrenData)
      .select()

    if (cError) throw cError
    if (!children) throw new Error('Failed to create children')

    // 4. Create Relationships
    const relationships: RelationshipInsert[] = []

    // Grandparents -> Dad (Assuming John & Mary are Robert's parents)
  relationships.push({ from_person_id: grandparents[0].id, to_person_id: parents[0].id, user_id: userId, type: 'parent' })
  relationships.push({ from_person_id: grandparents[1].id, to_person_id: parents[0].id, user_id: userId, type: 'parent' })

  // Parents -> Children
  parents.forEach(parent => {
    children.forEach(child => {
      relationships.push({ from_person_id: parent.id, to_person_id: child.id, user_id: userId, type: 'parent' })
    })
  })

    const { error: relError } = await supabase
      .from('relationships')
      .insert(relationships)

    if (relError) throw relError

    return true
  } catch (error) {
    console.error('Seed error:', error)
    throw error
  }
}
