'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonPhotos, useUploadPhoto, useDeletePhoto, useLifeEvents } from '@/lib/supabase/queries'
import { cn } from '@/lib/utils'
import { PhotoDetailDialog } from './PhotoDetailDialog'

interface PhotoGalleryProps {
  personId: string
  userId: string
  className?: string
}

export function PhotoGallery({ personId, userId, className }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: photos, isLoading } = usePersonPhotos(personId)
  const { data: lifeEvents } = useLifeEvents(personId)
  const uploadPhoto = useUploadPhoto()
  const deletePhoto = useDeletePhoto()
  
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await uploadPhoto.mutateAsync({
        file,
        personId,
        userId,
      })
    } catch (error) {
      console.error('Failed to upload photo:', error)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePhotoClick = (photo: any) => {
    setSelectedPhoto(photo)
    setIsDialogOpen(true)
  }

  const groupedPhotos = photos?.reduce((acc, photo) => {
    const key = photo.life_event_id || 'uncategorized'
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {} as Record<string, typeof photos>)

  const renderPhotoGrid = (photoList: NonNullable<typeof photos>) => (
    <div className="grid grid-cols-3 gap-2">
      {photoList.map((photo) => (
        <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-md border bg-muted cursor-pointer" onClick={() => handlePhotoClick(photo)}>
          <Image
            src={photo.url}
            alt={photo.description || "Person photo"}
            fill
            className="object-cover transition-all hover:scale-105"
            sizes="(max-width: 768px) 33vw, 20vw"
          />
          <button
            className="absolute right-1 top-1 rounded-full bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500 z-10"
            onClick={(e) => {
              e.stopPropagation()
              deletePhoto.mutate({ photoId: photo.id })
            }}
            disabled={deletePhoto.isPending}
          >
            <Trash2 className="h-3 w-3 text-white" />
          </button>
        </div>
      ))}
    </div>
  )

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Photos</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadPhoto.isPending}
        >
          {uploadPhoto.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : photos && photos.length > 0 ? (
        <div className="space-y-6">
          {/* Uncategorized */}
          {groupedPhotos?.['uncategorized'] && (
            <div className="space-y-2">
               {lifeEvents && lifeEvents.length > 0 && <h4 className="text-sm font-medium text-muted-foreground">General Photos</h4>}
               {renderPhotoGrid(groupedPhotos['uncategorized'])}
            </div>
          )}

          {/* Events */}
          {lifeEvents?.map(event => {
            const eventPhotos = groupedPhotos?.[event.id]
            if (!eventPhotos) return null
            return (
              <div key={event.id} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {event.title} <span className="text-xs opacity-70">{event.date ? `(${new Date(event.date).getFullYear()})` : ''}</span>
                </h4>
                {renderPhotoGrid(eventPhotos)}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed bg-muted/50 text-center text-sm text-muted-foreground">
          <p>No photos yet</p>
        </div>
      )}

      <PhotoDetailDialog 
        photo={selectedPhoto}
        lifeEvents={lifeEvents || []}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
