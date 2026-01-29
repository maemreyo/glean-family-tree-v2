import { useMemo } from 'react'
import { Users, User, UserMinus, Heart, Activity } from 'lucide-react'
import { useUIStore } from '@/providers/ui-store-provider'
import { PersonWithPhoto } from '@/types/app'
import { Database } from '@/types/database.types'

type Relationship = Database['public']['Tables']['relationships']['Row']

interface StatsPanelProps {
  persons: PersonWithPhoto[]
  relationships: Relationship[]
}

export function StatsPanel({ persons, relationships }: StatsPanelProps) {
  const showStatsPanel = useUIStore((state) => state.showStatsPanel)

  const stats = useMemo(() => {
    const totalPersons = persons.length
    const males = persons.filter((p) => p.gender === 'male' || p.gender === 'm' || p.gender === 'nam').length
    const females = persons.filter((p) => p.gender === 'female' || p.gender === 'f' || p.gender === 'nu' || p.gender === 'nữ').length
    const living = persons.filter((p) => p.is_deceased === false).length
    const deceased = persons.filter((p) => p.is_deceased === true).length
    const totalRelationships = relationships.length
    const marriages = relationships.filter((r) => r.type === 'spouse').length / 2 
    
    return {
      totalPersons,
      males,
      females,
      living,
      deceased,
      totalRelationships,
      marriages: Math.round(marriages),
    }
  }, [persons, relationships])

  if (!showStatsPanel) return null

  return (
    <div className="w-[280px] rounded-lg border bg-background/95 text-card-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <h3 className="text-sm font-medium leading-none tracking-tight flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Family Statistics
        </h3>
      </div>
      <div className="p-6 pt-0 grid gap-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Total
            </span>
            <span className="text-lg font-bold">{stats.totalPersons}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3" /> Marriages
            </span>
            <span className="text-lg font-bold">{stats.marriages}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3 text-blue-500" /> Males
            </span>
            <span className="font-semibold">{stats.males}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3 text-pink-500" /> Females
            </span>
            <span className="font-semibold">{stats.females}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-500" /> Living
            </span>
            <span className="font-semibold">{stats.living}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <UserMinus className="h-3 w-3 text-gray-500" /> Deceased
            </span>
            <span className="font-semibold">{stats.deceased}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
