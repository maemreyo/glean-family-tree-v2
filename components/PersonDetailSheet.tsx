'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/providers/ui-store-provider'
import { type Database } from '@/types/database.types'
import { useRelationships } from '@/lib/supabase/queries'

type Person = Database['public']['Tables']['persons']['Row']

interface PersonDetailSheetProps {
  persons: Person[]
  userId: string
  onAddRelative?: () => void
}

export function PersonDetailSheet({ persons, userId, onAddRelative }: PersonDetailSheetProps) {
  const selectedPersonId = useUIStore((state) => state.selectedPersonId)
  const closePersonModal = useUIStore((state) => state.closePersonModal)

  const { data: relationships = [] } = useRelationships(userId)

  const person = persons.find((p) => p.id === selectedPersonId)
  
  // Find spouse
  const spouseRelationship = relationships?.find(
    (r) =>
      r.relationship_type === 'spouse' &&
      (r.parent_id === selectedPersonId || r.child_id === selectedPersonId)
  )

  const spouseId = spouseRelationship
    ? spouseRelationship.parent_id === selectedPersonId
      ? spouseRelationship.child_id
      : spouseRelationship.parent_id
    : null

  const spouse = spouseId ? persons.find((p) => p.id === spouseId) : null

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
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">Information</h3>
              <p className="mt-2 text-sm text-gray-500">
                ID: {person.id}
              </p>
              {person.date_of_birth && (
                <p className="mt-1 text-sm text-gray-500">
                  Born: {new Date(person.date_of_birth).toLocaleDateString()}
                </p>
              )}
              {spouse && (
                <p className="mt-1 text-sm text-gray-500">
                  Spouse: <span className="font-medium text-gray-900 dark:text-gray-100">{spouse.name}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => console.log('Edit clicked')}>
                Edit Details
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (onAddRelative) onAddRelative()
                }}
              >
                Add Relative
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
