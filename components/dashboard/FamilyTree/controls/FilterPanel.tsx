import { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useUIStore } from '@/providers/ui-store-provider'
import { GenderFilter } from './GenderFilter'
import { StatusFilter } from './StatusFilter'
import { RelationshipFilter } from './RelationshipFilter'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X } from 'lucide-react'

interface FilterPanelProps {
  keywordInputRef?: RefObject<HTMLInputElement | null>
}

export function FilterPanel({ keywordInputRef }: FilterPanelProps) {
  const treeFilters = useUIStore((state) => state.treeFilters)
  const setTreeFilters = useUIStore((state) => state.setTreeFilters)
  const resetTreeFilters = useUIStore((state) => state.resetTreeFilters)

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetTreeFilters}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          Reset all
        </Button>
      </div>

      <ScrollArea className="flex-1 h-full w-full overflow-hidden">
        <div className="p-4 space-y-6">
          {/* Main Keyword Search */}
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Search</Label>
            <Input
              ref={keywordInputRef}
              placeholder="Search by name, notes..."
              value={treeFilters.keyword}
              onChange={(event) =>
                setTreeFilters((current) => ({
                  ...current,
                  keyword: event.target.value,
                }))
              }
              className="bg-muted/30"
            />
          </div>

          <Accordion type="multiple" defaultValue={['demographics', 'status']} className="w-full">
            <AccordionItem value="demographics" className="border-b-0">
              <AccordionTrigger className="py-2 hover:no-underline">
                <span className="text-sm font-semibold">Demographics</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <GenderFilter />
                
                <div className="space-y-2">
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
                      className="h-8"
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
                      className="h-8"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="status" className="border-b-0">
              <AccordionTrigger className="py-2 hover:no-underline">
                <span className="text-sm font-semibold">Status & Relationships</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <StatusFilter />
                <RelationshipFilter />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="details" className="border-b-0">
              <AccordionTrigger className="py-2 hover:no-underline">
                <span className="text-sm font-semibold">Detailed Info</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground">Profile Content</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2 rounded-md border p-2">
                      <Checkbox
                        id="has-photo"
                        checked={treeFilters.hasPhoto}
                        onCheckedChange={(checked) =>
                          setTreeFilters((current) => ({
                            ...current,
                            hasPhoto: Boolean(checked),
                          }))
                        }
                      />
                      <Label htmlFor="has-photo" className="text-xs font-normal cursor-pointer">Has Photo</Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-2">
                      <Checkbox
                        id="has-bio"
                        checked={treeFilters.hasBiography}
                        onCheckedChange={(checked) =>
                          setTreeFilters((current) => ({
                            ...current,
                            hasBiography: Boolean(checked),
                          }))
                        }
                      />
                      <Label htmlFor="has-bio" className="text-xs font-normal cursor-pointer">Has Bio</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Location</span>
                  <div className="grid gap-2">
                    <Input
                      placeholder="Birth Place"
                      value={treeFilters.birthPlace}
                      onChange={(event) =>
                        setTreeFilters((current) => ({
                          ...current,
                          birthPlace: event.target.value,
                        }))
                      }
                      className="h-8"
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
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Professional</span>
                  <Input
                    placeholder="Occupation"
                    value={treeFilters.occupation}
                    onChange={(event) =>
                      setTreeFilters((current) => ({
                        ...current,
                        occupation: event.target.value,
                      }))
                    }
                    className="h-8"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Tags</span>
                  <Input
                    placeholder="e.g. doctor, engineer"
                    value={treeFilters.tags}
                    onChange={(event) =>
                      setTreeFilters((current) => ({
                        ...current,
                        tags: event.target.value,
                      }))
                    }
                    className="h-8"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  )
}
