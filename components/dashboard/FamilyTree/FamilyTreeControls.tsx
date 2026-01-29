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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShareDialog } from './ShareDialog'
import { useUIStore } from '@/providers/ui-store-provider'

interface FamilyTreeControlsProps {
  userId: string
  readOnly?: boolean
  onAutoLayout: () => void
  onExport: () => void
  onExportGedcom: () => void
  onExportJson: () => void
  onImportGedcom: () => void
  onImportJson: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: FamilyTreeControlsProps) {
  const treeFilters = useUIStore((state) => state.treeFilters)
  const setTreeFilters = useUIStore((state) => state.setTreeFilters)
  const resetTreeFilters = useUIStore((state) => state.resetTreeFilters)
  const showStatsPanel = useUIStore((state) => state.showStatsPanel)
  const toggleStatsPanel = useUIStore((state) => state.toggleStatsPanel)

  return (
    <div className="flex gap-2">
      {!readOnly && <ShareDialog userId={userId} />}

      <Button onClick={onAutoLayout} variant="outline" size="sm" className="gap-2">
        <RotateCw className="h-4 w-4" />
        Auto Layout
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[360px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Bộ lọc nâng cao</span>
            <Button variant="ghost" size="sm" onClick={resetTreeFilters}>
              Đặt lại
            </Button>
          </div>
          <div className="mt-3 grid gap-4">
            <div className="grid gap-2">
              <span className="text-xs font-medium text-muted-foreground">Giới tính</span>
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
                  Nam
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
                  Nữ
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
                  Khác
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
                  Chưa rõ
                </Label>
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-xs font-medium text-muted-foreground">Tình trạng</span>
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
                  Còn sống
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
                  Đã mất
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
                  Chưa rõ
                </Label>
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-xs font-medium text-muted-foreground">Quan hệ</span>
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
                  Cha/Mẹ
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
                  Con
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
                  Vợ/Chồng
                </Label>
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-xs font-medium text-muted-foreground">Năm sinh</span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  inputMode="numeric"
                  placeholder="Từ"
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
                  placeholder="Đến"
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
              <span className="text-xs font-medium text-muted-foreground">Thông tin hồ sơ</span>
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
                  Có ảnh
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
                  Có tiểu sử
                </Label>
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-xs font-medium text-muted-foreground">Địa điểm</span>
              <Input
                placeholder="Nơi sinh"
                value={treeFilters.birthPlace}
                onChange={(event) =>
                  setTreeFilters((current) => ({
                    ...current,
                    birthPlace: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Nơi mất"
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
              <span className="text-xs font-medium text-muted-foreground">Nghề nghiệp</span>
              <Input
                placeholder="Nhập nghề nghiệp"
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
              <span className="text-xs font-medium text-muted-foreground">Từ khóa</span>
              <Input
                placeholder="Tên, ghi chú, tiểu sử..."
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
              <span className="text-xs font-medium text-muted-foreground">Thẻ</span>
              <Input
                placeholder="Ví dụ: họ Nguyễn, bác sĩ"
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
        </PopoverContent>
      </Popover>

      <Button
        onClick={toggleStatsPanel}
        variant={showStatsPanel ? 'default' : 'outline'}
        size="sm"
        className="gap-2"
      >
        <BarChart3 className="h-4 w-4" />
        Thống kê
      </Button>

      <Button onClick={onUndo} variant="outline" size="sm" className="gap-2" disabled={!canUndo}>
        <ArrowLeft className="h-4 w-4" />
        Hoàn tác
      </Button>

      <Button onClick={onRedo} variant="outline" size="sm" className="gap-2" disabled={!canRedo}>
        <ArrowRight className="h-4 w-4" />
        Làm lại
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
