// components/RelationshipModal.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateRelationship } from '@/lib/supabase/queries'
import { useToast } from '@/components/ui/use-toast'
import type { Person } from '@/types/supabase'

interface RelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  persons: Person[]
}

type RelationshipType = 'parent-child' | 'spouse'

/**
 * Improved RelationshipModal with:
 * - Shadcn UI components
 * - Support for both parent-child and spouse relationships
 * - Better validation
 * - Loading states
 * - Toast notifications
 */
export function RelationshipModal({
  isOpen,
  onClose,
  persons,
}: RelationshipModalProps) {
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('parent-child')
  
  // Parent-Child state
  const [parentId, setParentId] = useState<string>('')
  const [childId, setChildId] = useState<string>('')
  
  // Spouse state
  const [spouse1Id, setSpouse1Id] = useState<string>('')
  const [spouse2Id, setSpouse2Id] = useState<string>('')

  const createRelationship = useCreateRelationship()
  const { toast } = useToast()

  const resetForm = () => {
    setParentId('')
    setChildId('')
    setSpouse1Id('')
    setSpouse2Id('')
    setRelationshipType('parent-child')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    try {
      if (relationshipType === 'parent-child') {
        if (!parentId || !childId) {
          toast({
            title: 'Validation Error',
            description: 'Please select both parent and child.',
            variant: 'destructive',
          })
          return
        }

        if (parentId === childId) {
          toast({
            title: 'Validation Error',
            description: 'A person cannot be their own parent.',
            variant: 'destructive',
          })
          return
        }

        await createRelationship.mutateAsync({
          parent_id: parentId,
          child_id: childId,
          relationship_type: 'parent-child',
        })

        toast({
          title: 'Success',
          description: 'Parent-child relationship created.',
        })
      } else {
        if (!spouse1Id || !spouse2Id) {
          toast({
            title: 'Validation Error',
            description: 'Please select both spouses.',
            variant: 'destructive',
          })
          return
        }

        if (spouse1Id === spouse2Id) {
          toast({
            title: 'Validation Error',
            description: 'A person cannot be their own spouse.',
            variant: 'destructive',
          })
          return
        }

        await createRelationship.mutateAsync({
          parent_id: spouse1Id, // Using parent_id for spouse1
          child_id: spouse2Id,  // Using child_id for spouse2
          relationship_type: 'spouse',
        })

        toast({
          title: 'Success',
          description: 'Spouse relationship created.',
        })
      }

      handleClose()
    } catch (error) {
      console.error('Error creating relationship:', error)
      toast({
        title: 'Error',
        description: 'Failed to create relationship. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const isSubmitDisabled =
    createRelationship.isPending ||
    (relationshipType === 'parent-child' && (!parentId || !childId)) ||
    (relationshipType === 'spouse' && (!spouse1Id || !spouse2Id))

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Relationship</DialogTitle>
          <DialogDescription>
            Add a new relationship between family members.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={relationshipType}
          onValueChange={(value) => setRelationshipType(value as RelationshipType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parent-child">Parent-Child</TabsTrigger>
            <TabsTrigger value="spouse">Spouse</TabsTrigger>
          </TabsList>

          <TabsContent value="parent-child" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="parent">Parent</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger id="parent">
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {persons.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                      {person.date_of_birth && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (b. {new Date(person.date_of_birth).getFullYear()})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="child">Child</Label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger id="child">
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  {persons
                    .filter((p) => p.id !== parentId)
                    .map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                        {person.date_of_birth && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (b. {new Date(person.date_of_birth).getFullYear()})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="spouse" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="spouse1">First Person</Label>
              <Select value={spouse1Id} onValueChange={setSpouse1Id}>
                <SelectTrigger id="spouse1">
                  <SelectValue placeholder="Select first person" />
                </SelectTrigger>
                <SelectContent>
                  {persons.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="spouse2">Second Person</Label>
              <Select value={spouse2Id} onValueChange={setSpouse2Id}>
                <SelectTrigger id="spouse2">
                  <SelectValue placeholder="Select second person" />
                </SelectTrigger>
                <SelectContent>
                  {persons
                    .filter((p) => p.id !== spouse1Id)
                    .map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createRelationship.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {createRelationship.isPending ? (
              <>
                <span className="mr-2">Creating...</span>
                <span className="animate-spin">⏳</span>
              </>
            ) : (
              'Create Relationship'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
