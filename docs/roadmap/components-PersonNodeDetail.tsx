// components/PersonNodeDetail.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useUpdatePerson, useDeletePerson } from '@/lib/supabase/queries'
import { useToast } from '@/components/ui/use-toast'
import type { Person, Relationship } from '@/types/supabase'

interface PersonNodeDetailProps {
  person: Person | null
  isOpen: boolean
  onClose: () => void
  relationships?: Relationship[]
  persons?: Person[]
}

/**
 * Side panel cho viewing/editing person details
 * 
 * Features:
 * - View person information
 * - Edit name and date of birth
 * - Delete person (with confirmation)
 * - View related family members
 * - Statistics
 */
export function PersonNodeDetail({
  person,
  isOpen,
  onClose,
  relationships = [],
  persons = [],
}: PersonNodeDetailProps) {
  const [name, setName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')

  const updatePerson = useUpdatePerson()
  const deletePerson = useDeletePerson()
  const { toast } = useToast()

  useEffect(() => {
    if (person) {
      setName(person.name)
      setDateOfBirth(person.date_of_birth || '')
      setGender(person.gender || '')
    }
  }, [person])

  if (!person) return null

  const handleUpdate = async () => {
    try {
      await updatePerson.mutateAsync({
        id: person.id,
        updates: {
          name: name.trim(),
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
        },
      })

      toast({
        title: 'Success',
        description: 'Person updated successfully.',
      })
      onClose()
    } catch (error) {
      console.error('Error updating person:', error)
      toast({
        title: 'Error',
        description: 'Failed to update person. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${person.name}? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      await deletePerson.mutateAsync(person.id)

      toast({
        title: 'Success',
        description: 'Person deleted successfully.',
      })
      onClose()
    } catch (error) {
      console.error('Error deleting person:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete person. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Get family relationships
  const parents = relationships
    .filter((r) => r.child_id === person.id && r.relationship_type === 'parent-child')
    .map((r) => persons.find((p) => p.id === r.parent_id))
    .filter(Boolean)

  const children = relationships
    .filter((r) => r.parent_id === person.id && r.relationship_type === 'parent-child')
    .map((r) => persons.find((p) => p.id === r.child_id))
    .filter(Boolean)

  const spouses = relationships
    .filter(
      (r) =>
        r.relationship_type === 'spouse' &&
        (r.parent_id === person.id || r.child_id === person.id)
    )
    .map((r) => {
      const spouseId = r.parent_id === person.id ? r.child_id : r.parent_id
      return persons.find((p) => p.id === spouseId)
    })
    .filter(Boolean)

  const hasChanges =
    name !== person.name ||
    dateOfBirth !== (person.date_of_birth || '') ||
    gender !== (person.gender || '')

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Person Details</SheetTitle>
          <SheetDescription>
            View and edit information for {person.name}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Edit Form */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <Separator />

          {/* Family Relationships */}
          <div className="space-y-4">
            <h3 className="font-semibold">Family Relationships</h3>

            {parents.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Parents</div>
                <div className="flex flex-wrap gap-2">
                  {parents.map((parent) => (
                    <Badge key={parent.id} variant="secondary">
                      {parent.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {spouses.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Spouse(s)</div>
                <div className="flex flex-wrap gap-2">
                  {spouses.map((spouse) => (
                    <Badge key={spouse.id} variant="secondary">
                      {spouse.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {children.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Children</div>
                <div className="flex flex-wrap gap-2">
                  {children.map((child) => (
                    <Badge key={child.id} variant="secondary">
                      {child.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {parents.length === 0 && children.length === 0 && spouses.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No relationships yet. Add relationships from the main dashboard.
              </p>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-2">
            <h3 className="font-semibold">Metadata</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-xs">{person.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(person.created_at).toLocaleDateString()}</span>
              </div>
              {person.updated_at && person.updated_at !== person.created_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(person.updated_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleUpdate}
            disabled={!hasChanges || !name.trim() || updatePerson.isPending}
            className="flex-1"
          >
            {updatePerson.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deletePerson.isPending}
          >
            {deletePerson.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
