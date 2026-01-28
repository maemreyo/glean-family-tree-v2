'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Trash2, Calendar, MapPin, Loader2, X } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  useLifeEvents,
  useCreateLifeEvent,
  useDeleteLifeEvent,
} from '@/lib/supabase/queries'
import { cn } from '@/lib/utils'

// Schema for adding a life event
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().optional().or(z.literal('')),
  location: z.string().optional(),
  description: z.string().optional(),
  event_type: z.string().min(1, 'Type is required').default('generic'),
  confidence_level: z.string().optional(),
  source_url: z.string().optional(),
  source_notes: z.string().optional(),
})

interface LifeEventTimelineProps {
  personId: string
  userId: string
  className?: string
}

export function LifeEventTimeline({ personId, userId, className }: LifeEventTimelineProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { data: events, isLoading } = useLifeEvents(personId)
  const createEvent = useCreateLifeEvent()
  const deleteEvent = useDeleteLifeEvent()

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      date: '',
      location: '',
      description: '',
      event_type: 'generic',
      confidence_level: 'confirmed',
      source_url: '',
      source_notes: '',
    },
  })

  const onSubmit = (values: z.infer<typeof eventSchema>) => {
    createEvent.mutate(
      {
        person_id: personId,
        user_id: userId,
        title: values.title,
        date: values.date || null,
        location: values.location || null,
        description: values.description || null,
        event_type: values.event_type,
        confidence_level: values.confidence_level || null,
        source_url: values.source_url?.trim() ? values.source_url : null,
        source_notes: values.source_notes?.trim() ? values.source_notes : null,
      },
      {
        onSuccess: () => {
          setIsAdding(false)
          form.reset()
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Life Events</h3>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium">New Event</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsAdding(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Graduation, Married, Moved" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Details about this event..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
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
                      <Textarea
                        placeholder="Details about the source..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createEvent.isPending}>
                  {createEvent.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Event
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      <div className="relative border-l border-muted ml-3 space-y-6 pb-2">
        {events && events.length > 0 ? (
          events.map((event, index) => (
            <div key={event.id} className="relative pl-6 group">
              <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border border-background bg-muted-foreground/30 ring-4 ring-background group-hover:bg-primary transition-colors" />
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium leading-none">
                    {event.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteEvent.mutate({ id: event.id, personId })}
                    disabled={deleteEvent.isPending}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {event.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </p>
                )}

                {(event.confidence_level || event.source_url || event.source_notes) && (
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    {event.confidence_level && (
                      <div>
                        Confidence: <span className="capitalize">{event.confidence_level}</span>
                      </div>
                    )}
                    {event.source_url && (
                      <div>
                        Source: <span className="break-all">{event.source_url}</span>
                      </div>
                    )}
                    {event.source_notes && (
                      <div>
                        Notes: <span>{event.source_notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : !isAdding ? (
          <div className="pl-6 text-sm text-muted-foreground italic">
            No life events recorded.
          </div>
        ) : null}
      </div>
    </div>
  )
}
