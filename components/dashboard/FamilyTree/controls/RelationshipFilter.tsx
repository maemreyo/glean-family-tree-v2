import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useUIStore } from '@/providers/ui-store-provider'

export function RelationshipFilter() {
  const treeFilters = useUIStore((state) => state.treeFilters)
  const setTreeFilters = useUIStore((state) => state.setTreeFilters)

  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-muted-foreground">Relationships</span>
      <div className="grid grid-cols-2 gap-2">
        <Label>
          <Checkbox
            checked={treeFilters.relationships.parent}
            onCheckedChange={(checked) =>
              setTreeFilters((current) => ({
                ...current,
                relationships: {
                  ...current.relationships,
                  parent: Boolean(checked),
                },
              }))
            }
          />
          Parent
        </Label>
        <Label>
          <Checkbox
            checked={treeFilters.relationships.child}
            onCheckedChange={(checked) =>
              setTreeFilters((current) => ({
                ...current,
                relationships: {
                  ...current.relationships,
                  child: Boolean(checked),
                },
              }))
            }
          />
          Child
        </Label>
        <Label>
          <Checkbox
            checked={treeFilters.relationships.spouse}
            onCheckedChange={(checked) =>
              setTreeFilters((current) => ({
                ...current,
                relationships: {
                  ...current.relationships,
                  spouse: Boolean(checked),
                },
              }))
            }
          />
          Spouse
        </Label>
      </div>
    </div>
  )
}
