
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ArrowLeft, Printer, User, Baby, Heart, Briefcase, GraduationCap, Star, Scroll, Calendar, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database.types'

type Person = Database['public']['Tables']['persons']['Row'] & {
  person_photos: { url: string; is_profile_picture: boolean }[]
}

type LifeEvent = Database['public']['Tables']['life_events']['Row']

interface RelationshipWithPerson {
  related_person: Person
  type: 'parent' | 'child' | 'spouse'
}

interface PrintProfileClientProps {
  person: Person
  lifeEvents: LifeEvent[]
  familyMembers: RelationshipWithPerson[]
}

export function PrintProfileClient({ person, lifeEvents, familyMembers }: PrintProfileClientProps) {
  const router = useRouter()

  const profilePhoto = person.person_photos?.find(p => p.is_profile_picture) || person.person_photos?.[0]
  
  // Group family members
  const parents = familyMembers.filter(m => m.type === 'parent')
  const spouses = familyMembers.filter(m => m.type === 'spouse')
  const children = familyMembers.filter(m => m.type === 'child')

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return format(new Date(dateString), 'MMMM d, yyyy')
  }

  const getYear = (dateString: string | null) => {
    if (!dateString) return '?'
    return new Date(dateString).getFullYear()
  }

  const getEventIcon = (type: string | null) => {
    switch (type) {
      case 'birth': return <Baby className="h-4 w-4 text-white" />
      case 'death': return <div className="h-4 w-4 text-white flex items-center justify-center font-bold">†</div>
      case 'marriage': return <Heart className="h-4 w-4 text-white" />
      case 'career': return <Briefcase className="h-4 w-4 text-white" />
      case 'education': return <GraduationCap className="h-4 w-4 text-white" />
      case 'story': return <Star className="h-4 w-4 text-white" />
      case 'tradition': return <Scroll className="h-4 w-4 text-white" />
      default: return <Calendar className="h-4 w-4 text-white" />
    }
  }

  const getEventColor = (type: string | null) => {
    switch (type) {
      case 'birth': return 'bg-blue-500 border-blue-500'
      case 'death': return 'bg-gray-800 border-gray-800'
      case 'marriage': return 'bg-pink-500 border-pink-500'
      case 'career': return 'bg-amber-600 border-amber-600'
      case 'story': return 'bg-purple-500 border-purple-500'
      case 'tradition': return 'bg-emerald-600 border-emerald-600'
      default: return 'bg-gray-400 border-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white p-8 font-sans text-gray-900">
      {/* Navigation / Actions - Hidden on Print */}
      <div className="mx-auto max-w-3xl mb-8 flex justify-between print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print Profile
        </Button>
      </div>

      {/* Printable Content */}
      <div className="mx-auto max-w-3xl bg-white print:shadow-none shadow-lg rounded-xl overflow-hidden p-12 print:p-0 border print:border-none">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start border-b pb-8 mb-8">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-gray-100 shadow-sm">
            <AvatarImage src={profilePhoto?.url} className="object-cover" />
            <AvatarFallback className="text-4xl bg-gray-100 text-gray-400">
              <User />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{person.name}</h1>
            {person.nickname && (
              <p className="text-xl text-gray-500 mb-2">&ldquo;{person.nickname}&rdquo;</p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {person.gender || 'Unknown Gender'}
              </Badge>
              {person.occupation && (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {person.occupation}
                </Badge>
              )}
            </div>

            <div className="text-lg text-gray-700 space-y-1">
              <p>
                <span className="font-semibold w-24 inline-block">Born:</span>
                {formatDate(person.date_of_birth)}
                {person.birth_place && <span className="text-gray-500"> in {person.birth_place}</span>}
              </p>
              {person.is_deceased && (
                <p>
                  <span className="font-semibold w-24 inline-block">Died:</span>
                  {formatDate(person.date_of_death)}
                  {person.death_place && <span className="text-gray-500"> in {person.death_place}</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Biography Section */}
        {person.biography && (
          <div className="mb-8 border-b pb-8 print:break-inside-avoid">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-l-4 border-primary pl-3">Biography</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {person.biography}
            </div>
          </div>
        )}

        {/* Family Chart Section */}
        <div className="mb-8 border-b pb-8 print:break-inside-avoid">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-l-4 border-primary pl-3">Family Chart</h2>
          
          <div className="flex flex-col items-center gap-8 py-4">
            {/* Generation 1: Parents */}
            <div className="flex justify-center gap-12 relative">
              {parents.length > 0 ? (
                parents.map((p, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-32 p-3 border rounded-lg bg-gray-50 text-center shadow-sm print:shadow-none print:border-gray-300">
                      <p className="font-semibold text-sm truncate">{p.related_person.name}</p>
                      <p className="text-xs text-gray-500">Parent</p>
                    </div>
                    {/* Connector down */}
                    <div className="h-8 w-px bg-gray-300"></div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm italic p-4 border border-dashed rounded">Unknown Parents</div>
              )}
            </div>

            {/* Generation 2: Person + Spouses */}
            <div className="flex justify-center items-start gap-8 relative">
              {/* The Person */}
              <div className="flex flex-col items-center relative z-10">
                {/* Connector up (to parents) - simplified, just a top line if parents exist */}
                {parents.length > 0 && <div className="absolute -top-8 h-8 w-px bg-gray-300"></div>}
                
                <div className="w-40 p-4 border-2 border-primary rounded-xl bg-white text-center shadow-md print:shadow-none print:border-gray-800">
                  <p className="font-bold text-gray-900">{person.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(person.date_of_birth)}</p>
                </div>
                
                {/* Connector down (to children) */}
                {children.length > 0 && <div className="h-8 w-px bg-gray-300"></div>}
              </div>

              {/* Spouses */}
              {spouses.map((s, i) => (
                <div key={i} className="flex flex-col items-center mt-4">
                  <div className="w-32 p-3 border rounded-lg bg-gray-50 text-center shadow-sm print:shadow-none print:border-gray-300">
                    <p className="font-semibold text-sm truncate">{s.related_person.name}</p>
                    <p className="text-xs text-gray-500">Spouse</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Generation 3: Children */}
            {children.length > 0 && (
              <div className="relative pt-4 w-full">
                 {/* Horizontal connector bar */}
                <div className="absolute top-0 left-10 right-10 h-px bg-gray-300"></div>
                {/* Vertical connector from Gen 2 */}
                <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 h-8 w-px bg-gray-300"></div>
                
                <div className="flex flex-wrap justify-center gap-4">
                  {children.map((c, i) => (
                    <div key={i} className="flex flex-col items-center pt-4 relative">
                       {/* Connector up to horizontal bar */}
                      <div className="absolute top-0 h-4 w-px bg-gray-300"></div>
                      
                      <div className="w-28 p-2 border rounded-lg bg-gray-50 text-center shadow-sm print:shadow-none print:border-gray-300">
                        <p className="font-semibold text-xs truncate">{c.related_person.name}</p>
                        <p className="text-[10px] text-gray-500">{getYear(c.related_person.date_of_birth)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List-based Family Section (keeping as detail view) */}
        <div className="mb-8 border-b pb-8 print:break-inside-avoid">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-l-4 border-primary pl-3">Family</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm mb-3">Parents</h3>
              {parents.length > 0 ? (
                <ul className="space-y-2">
                  {parents.map((p, i) => (
                    <li key={i} className="text-gray-800">
                      <span className="font-medium">{p.related_person.name}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({getYear(p.related_person.date_of_birth)} - {p.related_person.is_deceased ? getYear(p.related_person.date_of_death) : ''})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic text-sm">No parents listed</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm mb-3">Spouse(s)</h3>
              {spouses.length > 0 ? (
                <ul className="space-y-2">
                  {spouses.map((p, i) => (
                    <li key={i} className="text-gray-800">
                      <span className="font-medium">{p.related_person.name}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({getYear(p.related_person.date_of_birth)})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic text-sm">No spouses listed</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm mb-3">Children</h3>
              {children.length > 0 ? (
                <ul className="space-y-2">
                  {children.map((p, i) => (
                    <li key={i} className="text-gray-800">
                      <span className="font-medium">{p.related_person.name}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({getYear(p.related_person.date_of_birth)})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic text-sm">No children listed</p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        {lifeEvents.length > 0 && (
          <div className="mb-8 print:break-inside-avoid">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-l-4 border-primary pl-3">Timeline</h2>
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
              {lifeEvents.map((event, index) => (
                <div key={index} className="relative pl-8">
                  <div className={`absolute -left-[11px] top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center shadow-sm print:shadow-none ${getEventColor(event.event_type)}`}>
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-1">
                    <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                    <span className="text-sm font-medium text-gray-500">{formatDate(event.date)}</span>
                  </div>
                  {event.description && (
                    <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-gray-500 text-xs mt-1 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" /> {event.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-gray-400 text-sm print:block hidden">
          <p>Generated by Glean Family Tree on {format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
      </div>
    </div>
  )
}
