import { Button } from '@/components/ui/button'
import { RotateCw, FileDown, Image as ImageIcon, FileText, Upload } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ShareDialog } from './ShareDialog'

interface FamilyTreeControlsProps {
  userId: string
  readOnly?: boolean
  onAutoLayout: () => void
  onExport: () => void
  onExportGedcom: () => void
  onExportJson: () => void
  onImportGedcom: () => void
  onImportJson: () => void
}

export function FamilyTreeControls({
  userId,
  readOnly = false,
  onAutoLayout,
  onExport,
  onExportGedcom,
  onExportJson,
  onImportGedcom,
  onImportJson,
}: FamilyTreeControlsProps) {
  return (
    <div className="flex gap-2">
      {!readOnly && <ShareDialog userId={userId} />}
      
      <Button onClick={onAutoLayout} variant="outline" size="sm" className="gap-2">
        <RotateCw className="h-4 w-4" />
        Auto Layout
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExport}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Export as Image (PNG)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportGedcom}>
            <FileText className="mr-2 h-4 w-4" />
            Export GEDCOM
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportJson}>
            <FileDown className="mr-2 h-4 w-4" />
            Export JSON Backup
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onImportGedcom}>
            <Upload className="mr-2 h-4 w-4" />
            Import GEDCOM
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onImportJson}>
            <Upload className="mr-2 h-4 w-4" />
            Import JSON Backup
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
