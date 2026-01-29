import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useUIStore } from '@/providers/ui-store-provider'

export function StatusFilter() {
  const treeFilters = useUIStore((state) => state.treeFilters)
  const setTreeFilters = useUIStore((state) => state.setTreeFilters)

  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-muted-foreground">Status</span>
      <div className="grid grid-cols-2 gap-2">
        <Label>
          <Checkbox
            checked={treeFilters.status.living}
            onCheckedChange={(checked) =>
              setTreeFilters((current) => ({
                ...current,
                status: { ...current.status, living: Boolean(checked) },
              }))
            }
          />
          Living
        </Label>
        <Label>
          <Checkbox
            checked={treeFilters.status.deceased}
            onCheckedChange={(checked) =>
              setTreeFilters((current) => ({
                ...current,
                status: { ...current.status, deceased: Boolean(checked) },
              }))
            }
          />
          Deceased
        </Label>
        <Label>
          <Checkbox
            checked={treeFilters.status.unknown}
            onCheckedChange={(checked) =>
              setTreeFilters((current) => ({
                ...current,
                status: { ...current.status, unknown: Boolean(checked) },
              }))
            }
          />
          Unknown
        </Label>
      </div>
    </div>
  )
}
