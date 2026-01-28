'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdatePhoto } from '@/lib/supabase/queries'
import { Loader2 } from 'lucide-react'

interface PhotoDetailDialogProps {
  photo: {
    id: string
    url: string
    description: string | null
    life_event_id: string | null
    person_id: string
  } | null
  lifeEvents: {
    id: string
    title: string
    date: string | null
    event_type: string
  }[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PhotoDetailDialog({ photo, lifeEvents, open, onOpenChange }: PhotoDetailDialogProps) {
  const [description, setDescription] = useState('')
  const [lifeEventId, setLifeEventId] = useState<string>('')
  const updatePhoto = useUpdatePhoto()

  useEffect(() => {
    if (photo) {
      setDescription(photo.description || '')
      setLifeEventId(photo.life_event_id || '')
    }
  }, [photo])

  const handleSave = async () => {
    if (!photo) return

    try {
      await updatePhoto.mutateAsync({
        id: photo.id,
        description: description || null,
        life_event_id: lifeEventId || null,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update photo:', error)
    }
  }

  if (!photo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Photo Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
            <Image
              src={photo.url}
              alt={photo.description || "Photo"}
              fill
              className="object-contain"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event" className="text-right">
              Event
            </Label>
            <select
              id="event"
              value={lifeEventId}
              onChange={(e) => setLifeEventId(e.target.value)}
              className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
            >
              <option value="">(None)</option>
              {lifeEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} {event.date ? `(${new Date(event.date).getFullYear()})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={updatePhoto.isPending}>
            {updatePhoto.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
