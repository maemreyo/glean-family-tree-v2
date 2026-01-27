import { Database } from './database.types'

export type PersonWithPhoto = Database['public']['Tables']['persons']['Row'] & {
  person_photos?: {
    url: string
    is_profile_picture: boolean
  }[]
}

export type Relationship = Database['public']['Tables']['relationships']['Row']
