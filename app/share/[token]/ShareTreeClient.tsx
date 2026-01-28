'use client'

import { FamilyTree } from '@/components/dashboard/FamilyTree'
import { PersonWithPhoto } from '@/types/app'
import { Database } from '@/types/database.types'

type Relationship = Database['public']['Tables']['relationships']['Row']

interface ShareTreeClientProps {
  userId: string
  persons: PersonWithPhoto[]
  relationships: Relationship[]
}

export function ShareTreeClient({ userId, persons, relationships }: ShareTreeClientProps) {
  return (
    <div className="h-screen w-screen bg-background">
      <FamilyTree 
        userId={userId} 
        persons={persons} 
        relationships={relationships} 
        readOnly={true} 
      />
    </div>
  )
}
