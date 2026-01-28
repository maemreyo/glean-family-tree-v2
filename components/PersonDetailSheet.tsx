'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { useUIStore } from '@/providers/ui-store-provider'
import { type Database } from '@/types/database.types'
import { useRelationships } from '@/lib/supabase/queries'
import { PersonMetadataForm } from '@/components/PersonMetadataForm'
import { PhotoGallery } from '@/components/PhotoGallery'
import { LifeEventTimeline } from '@/components/LifeEventTimeline'

type Person = Database['public']['Tables']['persons']['Row']

interface PersonDetailSheetProps {
  persons: Person[]
  userId: string
  onAddRelative?: () => void
}

export function PersonDetailSheet({ persons, userId, onAddRelative }: PersonDetailSheetProps) {
  const router = useRouter()
  const selectedPersonId = useUIStore((state) => state.selectedPersonId)
  const closePersonModal = useUIStore((state) => state.closePersonModal)

  const { data: relationships = [] } = useRelationships(userId)

  const person = persons.find((p) => p.id === selectedPersonId)
  
  // Find spouse
  const spouseRelationship = relationships?.find(
    (r) =>
      r.type === 'spouse' &&
      (r.from_person_id === selectedPersonId || r.to_person_id === selectedPersonId)
  )

  const spouseId = spouseRelationship
    ? spouseRelationship.from_person_id === selectedPersonId
      ? spouseRelationship.to_person_id
      : spouseRelationship.from_person_id
    : null

  const spouse = spouseId ? persons.find((p) => p.id === spouseId) : null
  const [isEditing, setIsEditing] = useState(false)

  // Reset editing state when person changes
  useEffect(() => {
    setIsEditing(false)
  }, [selectedPersonId])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closePersonModal()
    }
  }

  if (!selectedPersonId) return null

  return (
    <Sheet open={!!selectedPersonId} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{person?.name || 'Person Details'}</SheetTitle>
          <SheetDescription>
            Details about this family member.
          </SheetDescription>
        </SheetHeader>
        
        {person && (
          <div className="mt-6 flex flex-col gap-4">
            {isEditing ? (
              <PersonMetadataForm
                person={person}
                onSuccess={() => setIsEditing(false)}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                <div className="rounded-lg border p-4 space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Information</h3>
                    <div className="space-y-1">
                      {person.nickname && (
                        <p className="text-sm text-gray-500">
                          Nickname: <span className="font-medium text-foreground">{person.nickname}</span>
                        </p>
                      )}
                      {person.gender && (
                        <p className="text-sm text-gray-500 capitalize">
                          Gender: <span className="font-medium text-foreground">{person.gender}</span>
                        </p>
                      )}
                      {person.date_of_birth && (
                        <p className="text-sm text-gray-500">
                          Birth: <span className="font-medium text-foreground">{new Date(person.date_of_birth).toLocaleDateString()}</span>
                          {person.birth_place && <span className="text-muted-foreground"> in {person.birth_place}</span>}
                        </p>
                      )}
                      {person.is_deceased && (
                        <p className="text-sm text-gray-500">
                          Death: <span className="font-medium text-foreground">
                            {person.date_of_death ? new Date(person.date_of_death).toLocaleDateString() : 'Deceased'}
                          </span>
                          {person.death_place && <span className="text-muted-foreground"> in {person.death_place}</span>}
                        </p>
                      )}
                      {person.occupation && (
                        <p className="text-sm text-gray-500">
                          Occupation: <span className="font-medium text-foreground">{person.occupation}</span>
                        </p>
                      )}
                      {spouse && (
                        <p className="text-sm text-gray-500">
                          Spouse: <span className="font-medium text-foreground">{spouse.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {person.biography && (
                    <div>
                      <h3 className="font-medium mb-1">Biography</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {person.biography}
                      </p>
                    </div>
                  )}
                  
                  {person.notes && (
                    <div>
                      <h3 className="font-medium mb-1">Notes</h3>
                      <p className="text-sm text-gray-500 italic whitespace-pre-wrap">
                        {person.notes}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <PhotoGallery personId={person.id} userId={userId} />
                  </div>

                  <div className="pt-2 border-t">
                    <LifeEventTimeline personId={person.id} userId={userId} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => setIsEditing(true)} className="w-fit">
                    Edit Details
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (onAddRelative) onAddRelative()
                    }}
                    className="w-fit"
                  >
                    Add Relative
                  </Button>
                  <Button
                    variant="ghost"
                    className="gap-2 w-fit"
                    onClick={() => {
                      router.push(`/dashboard/print/${person.id}`)
                    }}
                  >
                    <Printer className="h-4 w-4" />
                    Print Profile
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
