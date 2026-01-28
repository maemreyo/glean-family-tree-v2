import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Note: This client should only be used on the server side
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function getSharedLink(token: string) {
  const { data, error } = await supabaseAdmin
    .from('shared_links')
    .select('*')
    .eq('token', token)
    .single()

  if (error) return null
  return data
}

export async function getSharedTreeData(token: string) {
  const link = await getSharedLink(token)
  
  if (!link || !link.is_active) {
    return null
  }
  
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
     return null
  }

  const userId = link.user_id

  const [personsResult, relationshipsResult] = await Promise.all([
    supabaseAdmin
      .from('persons')
      .select('*, person_photos(url, is_profile_picture)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('relationships')
      .select('*')
      .eq('user_id', userId)
  ])

  if (personsResult.error || relationshipsResult.error) {
    console.error('Error fetching tree data', personsResult.error, relationshipsResult.error)
    return null
  }

  const visiblePersons = (personsResult.data ?? []).filter(
    (person) => person.is_visible_in_share ?? true
  )
  const visiblePersonIds = new Set(visiblePersons.map((person) => person.id))
  const visibleRelationships = (relationshipsResult.data ?? []).filter(
    (relationship) =>
      visiblePersonIds.has(relationship.from_person_id) &&
      visiblePersonIds.has(relationship.to_person_id)
  )

  return {
    link,
    userId,
    persons: visiblePersons,
    relationships: visibleRelationships
  }
}
