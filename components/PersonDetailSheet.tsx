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

type Person = Database['public']['Tables']['persons']['Row']

interface PersonDetailSheetProps {
  persons: Person[]
  onAddRelative?: () => void
}

export function PersonDetailSheet({ persons, onAddRelative }: PersonDetailSheetProps) {
  const selectedPersonId = useUIStore((state) => state.selectedPersonId)
  const closePersonModal = useUIStore((state) => state.closePersonModal)

  const person = persons.find((p) => p.id === selectedPersonId)

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
              {/* Add more fields here later (birthdate, etc) */}
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
