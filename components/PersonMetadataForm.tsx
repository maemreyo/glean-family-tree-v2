'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { useUpdatePerson } from '@/lib/supabase/queries'
import type { Database } from '@/types/database.types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Person = Database['public']['Tables']['persons']['Row']

import { Checkbox } from '@/components/ui/checkbox'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gender: z.string().optional(),
  date_of_birth: z.string().optional().or(z.literal('')),
  is_deceased: z.boolean(),
  is_visible_in_share: z.boolean(),
  date_of_death: z.string().optional().or(z.literal('')),
  nickname: z.string().optional(),
  birth_place: z.string().optional(),
  death_place: z.string().optional(),
  occupation: z.string().optional(),
  biography: z.string().optional(),
  notes: z.string().optional(),
  confidence_level: z.string().optional(),
  source_url: z.string().optional(),
  source_notes: z.string().optional(),
})

interface PersonMetadataFormProps {
  person: Person
  onSuccess?: () => void
  onCancel?: () => void
}

export function PersonMetadataForm({ person, onSuccess, onCancel }: PersonMetadataFormProps) {
  const updatePerson = useUpdatePerson()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: person.name,
      gender: person.gender || '',
      date_of_birth: person.date_of_birth ? new Date(person.date_of_birth).toISOString().split('T')[0] : '',
      is_deceased: person.is_deceased || false,
      is_visible_in_share: person.is_visible_in_share ?? true,
      date_of_death: person.date_of_death ? new Date(person.date_of_death).toISOString().split('T')[0] : '',
      nickname: person.nickname || '',
      birth_place: person.birth_place || '',
      death_place: person.death_place || '',
      occupation: person.occupation || '',
      biography: person.biography || '',
      notes: person.notes || '',
      confidence_level: person.confidence_level || 'confirmed',
      source_url: person.source_url || '',
      source_notes: person.source_notes || '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    updatePerson.mutate(
      {
        id: person.id,
        ...values,
        date_of_birth: values.date_of_birth || null,
        is_deceased: values.is_deceased,
        is_visible_in_share: values.is_visible_in_share,
        date_of_death: values.is_deceased ? values.date_of_death || null : null,
        gender: values.gender || null,
        nickname: values.nickname || null,
        birth_place: values.birth_place || null,
        death_place: values.death_place || null,
        occupation: values.occupation || null,
        biography: values.biography || null,
        notes: values.notes || null,
        confidence_level: values.confidence_level || null,
        source_url: values.source_url?.trim() ? values.source_url : null,
        source_notes: values.source_notes?.trim() ? values.source_notes : null,
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess()
        },
      }
    )
  }

  const isDeceased = form.watch('is_deceased')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Full Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_deceased"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Deceased?
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_visible_in_share"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  id="is-visible-in-share"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel htmlFor="is-visible-in-share">
                  Visible in shared links
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {isDeceased && (
          <FormField
            control={form.control}
            name="date_of_death"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Death</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nickname</FormLabel>
              <FormControl>
                <Input placeholder="Nickname" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="birth_place"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birth Place</FormLabel>
                <FormControl>
                  <Input placeholder="City, Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="death_place"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Death Place</FormLabel>
                <FormControl>
                  <Input placeholder="City, Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="occupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Occupation</FormLabel>
              <FormControl>
                <Input placeholder="Job Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="biography"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biography</FormLabel>
              <FormControl>
                <Textarea placeholder="Life story..." className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="confidence_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confidence Level</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="speculative">Speculative</option>
                    <option value="uncertain">Uncertain</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="source_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Details about the source..." className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={updatePerson.isPending}>
            {updatePerson.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  )
}
