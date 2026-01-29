import { Button } from '@/components/ui/button'
import {
  RotateCw,
  FileDown,
  Image as ImageIcon,
  FileText,
  Upload,
  SlidersHorizontal,
  BarChart3,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ShareDialog } from './ShareDialog'
import { useUIStore } from '@/providers/ui-store-provider'
import { RefObject, useEffect } from 'react'
import { FilterPanel } from './controls/FilterPanel'

import { SearchFocus } from './controls/SearchFocus'
import { PersonWithPhoto } from '@/types/app'

interface FamilyTreeControlsProps {
  userId: string
  persons: PersonWithPhoto[]
  readOnly?: boolean
  onAutoLayout: () => void | Promise<void>
  onFocus: (personId: string) => void
  onExport: () => void | Promise<void>
  onExportGedcom: () => void | Promise<void>
  onExportJson: () => void | Promise<void>
  onImportGedcom: () => void
  onImportJson: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  filterOpen: boolean
  onFilterOpenChange: (open: boolean) => void
  keywordInputRef?: RefObject<HTMLInputElement | null>
  isBusy?: boolean
}

export function FamilyTreeControls({
  userId,
  persons,
  readOnly = false,
  onAutoLayout,
  onFocus,
  onExport,
  onExportGedcom,
  onExportJson,
  onImportGedcom,
  onImportJson,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  filterOpen,
  onFilterOpenChange,
  keywordInputRef,
  isBusy = false,
}: FamilyTreeControlsProps) {
  const showStatsPanel = useUIStore((state) => state.showStatsPanel)
  const toggleStatsPanel = useUIStore((state) => state.toggleStatsPanel)

  useEffect(() => {
    if (!filterOpen) return
    const input = keywordInputRef?.current
    if (!input) return
    requestAnimationFrame(() => input.focus())
  }, [filterOpen, keywordInputRef])

  return (
    <div className="flex gap-2">
      <SearchFocus persons={persons} onFocus={onFocus} />
      {!readOnly && <ShareDialog userId={userId} />}

      <Button onClick={onAutoLayout} variant="outline" size="sm" className="gap-2" disabled={isBusy}>
        <RotateCw className="h-4 w-4" />
        Auto Layout
      </Button>

      <Popover open={filterOpen} onOpenChange={onFilterOpenChange} modal={false}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[360px]">
          <FilterPanel keywordInputRef={keywordInputRef} />
        </PopoverContent>
      </Popover>

      <Button
        onClick={toggleStatsPanel}
        variant={showStatsPanel ? 'default' : 'outline'}
        size="sm"
        className="gap-2"
      >
        <BarChart3 className="h-4 w-4" />
        Stats
      </Button>

      <Button onClick={onUndo} variant="outline" size="sm" className="gap-2" disabled={!canUndo}>
        <ArrowLeft className="h-4 w-4" />
        Undo
      </Button>

      <Button onClick={onRedo} variant="outline" size="sm" className="gap-2" disabled={!canRedo}>
        <ArrowRight className="h-4 w-4" />
        Redo
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={isBusy}>
            <FileDown className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExport} disabled={isBusy}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Export as Image (PNG)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportGedcom} disabled={isBusy}>
            <FileText className="mr-2 h-4 w-4" />
            Export GEDCOM
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportJson} disabled={isBusy}>
            <FileDown className="mr-2 h-4 w-4" />
            Export JSON Backup
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onImportGedcom} disabled={isBusy}>
            <Upload className="mr-2 h-4 w-4" />
            Import GEDCOM
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onImportJson} disabled={isBusy}>
            <Upload className="mr-2 h-4 w-4" />
            Import JSON Backup
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
