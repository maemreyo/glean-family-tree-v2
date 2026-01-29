import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useUIStore } from '@/providers/ui-store-provider'

export function GenderFilter() {
  const treeFilters = useUIStore((state) => state.treeFilters)
  const setTreeFilters = useUIStore((state) => state.setTreeFilters)

  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-muted-foreground">Gender</span>
      <div className="grid grid-cols-2 gap-2">
        <Label>
          <Checkbox
            checked={treeFilters.gender.male}
            onCheckedChange={(checked) =>
              setTreeFilters((current) => ({
                ...current,
                gender: { ...current.gender, male: Boolean(checked) },
              }))
            }
          />
          Male
        </Label>
        <Label>
          <Checkbox
            checked={treeFilters.gender.female}
            onCheckedChange={(checked) =>
              setTreeFilters((current) => ({
                ...current,
                gender: { ...current.gender, female: Boolean(checked) },
              }))
            }
          />
          Female
        </Label>
        <Label>
          <Checkbox
            checked={treeFilters.gender.other}
            onCheckedChange={(checked) =>
              setTreeFilters((current) => ({
                ...current,
                gender: { ...current.gender, other: Boolean(checked) },
              }))
            }
          />
          Other
        </Label>
        <Label>
          <Checkbox
            checked={treeFilters.gender.unknown}
            onCheckedChange={(checked) =>
              setTreeFilters((current) => ({
                ...current,
                gender: { ...current.gender, unknown: Boolean(checked) },
              }))
            }
          />
          Unknown
        </Label>
      </div>
    </div>
  )
}
