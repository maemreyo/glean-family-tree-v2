'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Printer } from 'lucide-react'
import { useReactFlow } from 'reactflow'
import { toast } from 'sonner'

export function PrintDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paperSize, setPaperSize] = useState('A0')
  const { getNodes, getEdges } = useReactFlow()

  const handleExport = async () => {
    try {
      setLoading(true)
      const nodes = getNodes()
      const edges = getEdges()

      // Calculate dimensions based on paper size (at 300 DPI)
      let width = 9933
      let height = 14043

      switch (paperSize) {
        case 'A0':
          width = 9933
          height = 14043
          break
        case 'A1':
          width = 7016
          height = 9933
          break
        case 'A2':
          width = 4961
          height = 7016
          break
        case 'A3':
          width = 3508
          height = 4961
          break
      }

      const response = await fetch('/api/export-svg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes,
          edges,
          width,
          height,
          title: 'Family Tree'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate SVG')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `family-tree-${paperSize}.svg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setOpen(false)
      toast.success('File exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export family tree')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Print High Quality" className="hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50">
          <Printer className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>High Quality Print Export</DialogTitle>
          <DialogDescription>
            Export your family tree as a high-resolution SVG file suitable for large format printing (A0, A1, etc).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paper-size" className="text-right">
              Paper Size
            </Label>
            <Select value={paperSize} onValueChange={setPaperSize}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A0">A0 (841 x 1189 mm)</SelectItem>
                <SelectItem value="A1">A1 (594 x 841 mm)</SelectItem>
                <SelectItem value="A2">A2 (420 x 594 mm)</SelectItem>
                <SelectItem value="A3">A3 (297 x 420 mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleExport} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Download SVG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
