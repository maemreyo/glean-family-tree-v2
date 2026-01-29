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
  Share2,
  Layout,
  List,
  Maximize2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ShareDialog } from './ShareDialog'
import { PrintDialog } from './PrintDialog'
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
  const nodeDisplayMode = useUIStore((state) => state.nodeDisplayMode)
  const setNodeDisplayMode = useUIStore((state) => state.setNodeDisplayMode)

  useEffect(() => {
    if (!filterOpen) return
    const input = keywordInputRef?.current
    if (!input) return
    requestAnimationFrame(() => input.focus())
  }, [filterOpen, keywordInputRef])

  return (
    <div className="flex gap-2">
      <SearchFocus persons={persons} onFocus={onFocus} />

      <div className="flex items-center gap-1 rounded-md border border-input bg-background shadow-xs dark:bg-input/30 dark:border-input p-1">
        <Select value={nodeDisplayMode} onValueChange={setNodeDisplayMode}>
          <SelectTrigger className="w-[130px] h-9 border-none bg-transparent focus:ring-0">
            <div className="flex items-center gap-2">
              {nodeDisplayMode === 'default' && <Layout className="h-4 w-4" />}
              {nodeDisplayMode === 'compact' && <List className="h-4 w-4" />}
              {nodeDisplayMode === 'detailed' && <Maximize2 className="h-4 w-4" />}
              {nodeDisplayMode === 'portrait' && <ImageIcon className="h-4 w-4" />}
              <span className="hidden sm:inline-block">
                {nodeDisplayMode === 'default' && 'Default'}
                {nodeDisplayMode === 'compact' && 'Compact'}
                {nodeDisplayMode === 'detailed' && 'Detailed'}
                {nodeDisplayMode === 'portrait' && 'Portrait'}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">
              <div className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                <span>Default</span>
              </div>
            </SelectItem>
            <SelectItem value="compact">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span>Compact</span>
              </div>
            </SelectItem>
            <SelectItem value="detailed">
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                <span>Detailed</span>
              </div>
            </SelectItem>
            <SelectItem value="portrait">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>Portrait</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        <div className="w-px h-6 bg-border mx-1" />

        <Button onClick={onAutoLayout} variant="ghost" size="icon" title="Auto Layout" disabled={isBusy} className="hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50">
          <RotateCw className="h-4 w-4" />
        </Button>

        <PrintDialog />

        <Popover open={filterOpen} onOpenChange={onFilterOpenChange} modal={false}>
          <PopoverTrigger asChild>
            <Button variant={filterOpen ? 'secondary' : 'ghost'} size="icon" title="Filters" className="hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            align="end" 
            className="w-[360px] p-0" 
            onOpenAutoFocus={(e) => e.preventDefault()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <FilterPanel keywordInputRef={keywordInputRef} />
          </PopoverContent>
        </Popover>

        <Button
          onClick={toggleStatsPanel}
          variant={showStatsPanel ? 'secondary' : 'ghost'}
          size="icon"
          title="Statistics"
          className="hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 rounded-md border border-input bg-background shadow-xs dark:bg-input/30 dark:border-input p-1">
        <Button onClick={onUndo} variant="ghost" size="icon" title="Undo" disabled={!canUndo} className="hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Button onClick={onRedo} variant="ghost" size="icon" title="Redo" disabled={!canRedo} className="hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 rounded-md border border-input bg-background shadow-xs dark:bg-input/30 dark:border-input p-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Export / Import" disabled={isBusy} className="hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50">
              <FileDown className="h-4 w-4" />
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

        {!readOnly && (
          <ShareDialog
            userId={userId}
            trigger={
              <Button variant="ghost" size="icon" title="Share" className="hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50">
                <Share2 className="h-4 w-4" />
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}
