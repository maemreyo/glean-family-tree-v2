'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useCreateRelationship, useRelationships } from '@/lib/supabase/queries'
import { useUIStore } from '@/providers/ui-store-provider'
import type { Database } from '@/types/database.types'
import { RelationshipValidator } from '@/lib/validation/relationship-validator'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Person = Database['public']['Tables']['persons']['Row']

const formSchema = z.object({
  type: z.enum(['parent', 'spouse']),
  fromPersonId: z.string().min(1, 'Please select a parent'),
  toPersonId: z.string().min(1, 'Please select a child'),
})

interface RelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  persons: Person[]
  userId: string
}

export function RelationshipModal({
  isOpen,
  onClose,
  persons,
  userId,
}: RelationshipModalProps) {
  const [activeTab, setActiveTab] = useState<'parent' | 'spouse'>('parent')
  const createRelationship = useCreateRelationship()
  const { data: relationships = [] } = useRelationships(userId)
  const showToast = useUIStore((state) => state.showToast)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'parent',
      fromPersonId: '',
      toPersonId: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const validator = new RelationshipValidator(relationships, persons)

    if (values.type === 'spouse') {
      const validation = validator.validateSpouse(values.fromPersonId, values.toPersonId)
      
      if (!validation.valid) {
        showToast(validation.error || 'Invalid spouse relationship', 'error')
        return
      }

      try {
        await createRelationship.mutateAsync({
          from_person_id: values.fromPersonId,
          to_person_id: values.toPersonId,
          user_id: userId,
          relationship_type: 'spouse',
        })
        showToast('Spouse relationship created successfully!', 'success')
        form.reset()
        onClose()
      } catch (error) {
        console.error('Error creating spouse relationship:', error)
        showToast('Failed to create spouse relationship', 'error')
      }
      return
    }

    const validation = validator.validateParentChild(values.fromPersonId, values.toPersonId)

    if (!validation.valid) {
      showToast(validation.error || 'Invalid relationship', 'error')
      return
    }

    try {
      await createRelationship.mutateAsync({
        from_person_id: values.fromPersonId,
        to_person_id: values.toPersonId,
        user_id: userId,
        relationship_type: 'parent',
      })
      showToast('Relationship created successfully!', 'success')
      form.reset()
      onClose()
    } catch (error) {
      console.error('Error creating relationship:', error)
      showToast('Failed to create relationship', 'error')
    }
  }

  // Reset form when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset({
        type: 'parent',
        fromPersonId: '',
        toPersonId: '',
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
          <DialogDescription>
            Connect people in your family tree.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => {
          const type = v as 'parent' | 'spouse'
          setActiveTab(type)
          form.setValue('type', type)
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parent">Parent-Child</TabsTrigger>
            <TabsTrigger value="spouse">Spouse</TabsTrigger>
          </TabsList>
          
          <div className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fromPersonId" 
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{activeTab === 'spouse' ? 'Partner 1' : 'Parent'}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? persons.find(
                                    (person) => person.id === field.value
                                  )?.name
                                : (activeTab === 'spouse' ? "Select partner 1" : "Select parent")}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Search person..." />
                            <CommandList>
                              <CommandEmpty>No person found.</CommandEmpty>
                              <CommandGroup>
                                {persons.map((person) => (
                                  <CommandItem
                                    value={person.name}
                                    key={person.id}
                                    onSelect={() => {
                                      form.setValue("fromPersonId", person.id)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        person.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {person.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toPersonId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{activeTab === 'spouse' ? 'Partner 2' : 'Child'}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? persons.find(
                                    (person) => person.id === field.value
                                  )?.name
                                : (activeTab === 'spouse' ? "Select partner 2" : "Select child")}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Search person..." />
                            <CommandList>
                              <CommandEmpty>No person found.</CommandEmpty>
                              <CommandGroup>
                                {persons.map((person) => (
                                  <CommandItem
                                    value={person.name}
                                    key={person.id}
                                    onSelect={() => {
                                      form.setValue("toPersonId", person.id)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        person.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {person.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" type="button" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRelationship.isPending}
                  >
                    {createRelationship.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Relationship
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
