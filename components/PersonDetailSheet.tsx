'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Printer, Pencil, UserPlus, Calendar, Image as ImageIcon, Info } from 'lucide-react'
import { useUIStore } from '@/providers/ui-store-provider'
import { type Database } from '@/types/database.types'
import { useRelationships } from '@/lib/supabase/queries'
import { PersonMetadataForm } from '@/components/PersonMetadataForm'
import { PhotoGallery } from '@/components/PhotoGallery'
import { LifeEventTimeline } from '@/components/LifeEventTimeline'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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

  // Get profile photo if available (assuming the first photo is profile or logic exists)
  // Since we don't have direct access to photos here without fetching or passing, 
  // we'll skip the avatar for now or rely on what's passed in 'person' if it had it.
  // The 'Person' type from database might not have 'person_photos' joined yet unless 'persons' prop has it.
  // Looking at previous code, 'persons' seems to be just 'Person[]'. 
  // Wait, DashboardClient passes 'persons' which are 'PersonWithPhoto[]'. 
  // Let's cast or check if we can use it.
  const personWithPhoto = person as any; // Temporary cast to access potential photos
  const profilePhotoUrl = personWithPhoto?.person_photos?.find((p: any) => p.is_profile_picture)?.url || personWithPhoto?.person_photos?.[0]?.url;

  return (
    <Sheet open={!!selectedPersonId} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-background">
        {person && (
          <>
            {/* Header with Actions */}
            <div className="flex flex-col border-b px-6 py-4 space-y-4">
              <SheetHeader className="flex flex-row items-start justify-between space-y-0">
                 <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
                      <AvatarImage src={profilePhotoUrl} className="object-cover" />
                      <AvatarFallback className="text-lg bg-muted">{person.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <SheetTitle className="text-2xl font-bold leading-none">{person.name}</SheetTitle>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {person.date_of_birth ? new Date(person.date_of_birth).getFullYear() : '?'} 
                        {' - '} 
                        {person.is_deceased ? (person.date_of_death ? new Date(person.date_of_death).getFullYear() : 'Deceased') : 'Present'}
                      </div>
                    </div>
                 </div>
              </SheetHeader>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => setIsEditing(true)} 
                  variant={isEditing ? "secondary" : "outline"}
                  className="gap-2 flex-1 sm:flex-none"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onAddRelative?.()}
                  className="gap-2 flex-1 sm:flex-none"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Relative
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2 px-2"
                  onClick={() => router.push(`/dashboard/print/${person.id}`)}
                  title="Print Profile"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative">
              {isEditing ? (
                <div className="h-full overflow-y-auto">
                  <div className="p-6">
                    <PersonMetadataForm
                      person={person}
                      onSuccess={() => setIsEditing(false)}
                      onCancel={() => setIsEditing(false)}
                    />
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="info" className="h-full flex flex-col">
                  <div className="px-6 pt-2 border-b bg-muted/20">
                    <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
                      <TabsTrigger 
                        value="info" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                      >
                        <Info className="mr-2 h-4 w-4" />
                        Info
                      </TabsTrigger>
                      <TabsTrigger 
                        value="photos" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Photos
                      </TabsTrigger>
                      <TabsTrigger 
                        value="timeline" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Timeline
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-muted/5">
                    <div className="p-6">
                      <TabsContent value="info" className="mt-0 space-y-6">
                        {/* Basic Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                          <InfoItem label="Nickname" value={person.nickname} />
                          <InfoItem label="Gender" value={person.gender} capitalize />
                          <InfoItem 
                            label="Birth" 
                            value={person.date_of_birth ? new Date(person.date_of_birth).toLocaleDateString() : null} 
                            subValue={person.birth_place ? `in ${person.birth_place}` : undefined}
                          />
                          <InfoItem 
                            label="Death" 
                            value={person.is_deceased ? (person.date_of_death ? new Date(person.date_of_death).toLocaleDateString() : 'Deceased') : null}
                            subValue={person.death_place ? `in ${person.death_place}` : undefined}
                          />
                          <InfoItem label="Occupation" value={person.occupation} />
                          <InfoItem label="Spouse" value={spouse?.name} />
                        </div>

                        {/* Biography & Notes */}
                        {(person.biography || person.notes) && (
                           <div className="space-y-6 pt-4 border-t">
                              {person.biography && (
                                <div className="space-y-2">
                                  <h3 className="font-semibold flex items-center gap-2">
                                    Biography
                                  </h3>
                                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap rounded-md bg-background border p-3">
                                    {person.biography}
                                  </div>
                                </div>
                              )}
                              
                              {person.notes && (
                                <div className="space-y-2">
                                  <h3 className="font-semibold flex items-center gap-2">
                                    Notes
                                  </h3>
                                  <div className="text-sm text-muted-foreground italic whitespace-pre-wrap rounded-md bg-yellow-50/50 dark:bg-yellow-900/10 border p-3">
                                    {person.notes}
                                  </div>
                                </div>
                              )}
                           </div>
                        )}
                      </TabsContent>

                      <TabsContent value="photos" className="mt-0">
                        <PhotoGallery personId={person.id} userId={userId} />
                      </TabsContent>

                      <TabsContent value="timeline" className="mt-0">
                        <LifeEventTimeline personId={person.id} userId={userId} />
                      </TabsContent>
                    </div>
                  </div>
                </Tabs>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function InfoItem({ label, value, subValue, capitalize }: { label: string, value: string | null | undefined, subValue?: string, capitalize?: boolean }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <p className={`text-sm font-medium ${capitalize ? 'capitalize' : ''}`}>
        {value}
        {subValue && <span className="text-muted-foreground font-normal ml-1">{subValue}</span>}
      </p>
    </div>
  )
}
