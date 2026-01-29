import { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useUIStore } from '@/providers/ui-store-provider'
import { GenderFilter } from './GenderFilter'
import { StatusFilter } from './StatusFilter'
import { RelationshipFilter } from './RelationshipFilter'

interface FilterPanelProps {
  keywordInputRef?: RefObject<HTMLInputElement | null>
}

export function FilterPanel({ keywordInputRef }: FilterPanelProps) {
  const treeFilters = useUIStore((state) => state.treeFilters)
  const setTreeFilters = useUIStore((state) => state.setTreeFilters)
  const resetTreeFilters = useUIStore((state) => state.resetTreeFilters)

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Advanced Filters</span>
        <Button variant="ghost" size="sm" onClick={resetTreeFilters}>
          Reset
        </Button>
      </div>
      <div className="mt-3 grid gap-4">
        <GenderFilter />
        <StatusFilter />
        <RelationshipFilter />

        <div className="grid gap-2">
          <span className="text-xs font-medium text-muted-foreground">Birth Year</span>
          <div className="grid grid-cols-2 gap-2">
            <Input
              inputMode="numeric"
              placeholder="From"
              value={treeFilters.birthYear.min}
              onChange={(event) =>
                setTreeFilters((current) => ({
                  ...current,
                  birthYear: { ...current.birthYear, min: event.target.value },
                }))
              }
            />
            <Input
              inputMode="numeric"
              placeholder="To"
              value={treeFilters.birthYear.max}
              onChange={(event) =>
                setTreeFilters((current) => ({
                  ...current,
                  birthYear: { ...current.birthYear, max: event.target.value },
                }))
              }
            />
          </div>
        </div>

        <div className="grid gap-2">
          <span className="text-xs font-medium text-muted-foreground">Profile Info</span>
          <div className="grid grid-cols-2 gap-2">
            <Label>
              <Checkbox
                checked={treeFilters.hasPhoto}
                onCheckedChange={(checked) =>
                  setTreeFilters((current) => ({
                    ...current,
                    hasPhoto: Boolean(checked),
                  }))
                }
              />
              Has Photo
            </Label>
            <Label>
              <Checkbox
                checked={treeFilters.hasBiography}
                onCheckedChange={(checked) =>
                  setTreeFilters((current) => ({
                    ...current,
                    hasBiography: Boolean(checked),
                  }))
                }
              />
              Has Biography
            </Label>
          </div>
        </div>

        <div className="grid gap-2">
          <span className="text-xs font-medium text-muted-foreground">Location</span>
          <Input
            placeholder="Birth Place"
            value={treeFilters.birthPlace}
            onChange={(event) =>
              setTreeFilters((current) => ({
                ...current,
                birthPlace: event.target.value,
              }))
            }
          />
          <Input
            placeholder="Death Place"
            value={treeFilters.deathPlace}
            onChange={(event) =>
              setTreeFilters((current) => ({
                ...current,
                deathPlace: event.target.value,
              }))
            }
          />
        </div>

        <div className="grid gap-2">
          <span className="text-xs font-medium text-muted-foreground">Occupation</span>
          <Input
            placeholder="Enter occupation"
            value={treeFilters.occupation}
            onChange={(event) =>
              setTreeFilters((current) => ({
                ...current,
                occupation: event.target.value,
              }))
            }
          />
        </div>

        <div className="grid gap-2">
          <span className="text-xs font-medium text-muted-foreground">Keywords</span>
          <Input
            ref={keywordInputRef}
            placeholder="Name, notes, biography..."
            value={treeFilters.keyword}
            onChange={(event) =>
              setTreeFilters((current) => ({
                ...current,
                keyword: event.target.value,
              }))
            }
          />
        </div>

        <div className="grid gap-2">
          <span className="text-xs font-medium text-muted-foreground">Tags</span>
          <Input
            placeholder="Ex: doctor, engineer"
            value={treeFilters.tags}
            onChange={(event) =>
              setTreeFilters((current) => ({
                ...current,
                tags: event.target.value,
              }))
            }
          />
        </div>
      </div>
    </>
  )
}
