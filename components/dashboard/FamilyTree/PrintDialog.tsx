'use client'

import { useState, useRef } from 'react'
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
import { Loader2, Printer, Eye } from 'lucide-react'
import { useReactFlow, getRectOfNodes, getTransformForBounds } from 'reactflow'
import { toSvg, toPng, toJpeg } from 'html-to-image'
import { toast } from 'sonner'
import jsPDF from 'jspdf'

type ExportFormat = 'svg' | 'png' | 'jpeg' | 'pdf'

export function PrintDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paperSize, setPaperSize] = useState('A0')
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { getNodes } = useReactFlow()
  
  const generateImage = async (format: ExportFormat) => {
    const nodes = getNodes()
    const nodesBounds = getRectOfNodes(nodes)
    
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!viewportElement) {
      throw new Error('Viewport not found')
    }

    const padding = 50
    const width = nodesBounds.width + padding * 2
    const height = nodesBounds.height + padding * 2

    const transform = getTransformForBounds(
      nodesBounds,
      width,
      height,
      0.5,
      padding
    )

    const backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim() || '#fff'

    const options = {
      backgroundColor,
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
      filter: (node: HTMLElement) => {
        const classList = node?.classList
        return !classList?.contains('react-flow__minimap') && !classList?.contains('react-flow__controls')
      }
    }

    if (format === 'svg') {
      return await toSvg(viewportElement, options)
    } else if (format === 'jpeg') {
      return await toJpeg(viewportElement, { ...options, quality: 0.95 })
    } else {
      return await toPng(viewportElement, { ...options, quality: 0.95 })
    }
  }

  const handlePreview = async () => {
    try {
      setLoading(true)
      // Always preview as PNG for browser compatibility
      const dataUrl = await generateImage('png')
      setPreviewUrl(dataUrl)
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to generate preview')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      
      let dataUrl = ''
      
      if (format === 'pdf') {
        // For PDF, we first generate a high-quality PNG
        const imgData = await generateImage('png')
        
        // A0 dimensions in mm
        const a0Width = 841
        const a0Height = 1189
        
        let pdfWidth = a0Width
        let pdfHeight = a0Height
        
        // Adjust based on selected paper size
        switch (paperSize) {
          case 'A1': pdfWidth = 594; pdfHeight = 841; break;
          case 'A2': pdfWidth = 420; pdfHeight = 594; break;
          case 'A3': pdfWidth = 297; pdfHeight = 420; break;
          case 'A4': pdfWidth = 210; pdfHeight = 297; break;
        }

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [pdfWidth, pdfHeight]
        })

        // Calculate scaling to fit the image into the PDF page while maintaining aspect ratio
        const imgProps = pdf.getImageProperties(imgData)
        const pdfRatio = pdfWidth / pdfHeight
        const imgRatio = imgProps.width / imgProps.height
        
        let finalWidth = pdfWidth
        let finalHeight = pdfHeight
        
        if (imgRatio > pdfRatio) {
          finalHeight = pdfWidth / imgRatio
        } else {
          finalWidth = pdfHeight * imgRatio
        }
        
        // Center the image
        const x = (pdfWidth - finalWidth) / 2
        const y = (pdfHeight - finalHeight) / 2

        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
        pdf.save(`family-tree-${paperSize}.pdf`)
        toast.success('PDF exported successfully!')
        setOpen(false)
        return
      }

      // Handle other formats
      dataUrl = await generateImage(format)
      
      const link = document.createElement('a')
      link.download = `family-tree-${paperSize}.${format}`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>High Quality Print Export</DialogTitle>
          <DialogDescription>
            Export your family tree in various formats suitable for large format printing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="paper-size">Paper Size (for PDF)</Label>
              <Select value={paperSize} onValueChange={setPaperSize}>
                <SelectTrigger id="paper-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A0">A0 (841 x 1189 mm)</SelectItem>
                  <SelectItem value="A1">A1 (594 x 841 mm)</SelectItem>
                  <SelectItem value="A2">A2 (420 x 594 mm)</SelectItem>
                  <SelectItem value="A3">A3 (297 x 420 mm)</SelectItem>
                  <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="format">Export Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF (Document)</SelectItem>
                  <SelectItem value="png">PNG (High Quality Image)</SelectItem>
                  <SelectItem value="jpeg">JPEG (Compressed Image)</SelectItem>
                  <SelectItem value="svg">SVG (Vector)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handlePreview} variant="outline" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Generate Preview
            </Button>
          </div>

          <div className="border rounded-lg bg-muted/50 flex items-center justify-center min-h-[300px] p-4 relative overflow-hidden">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full max-h-[300px] object-contain shadow-lg border bg-white" 
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Click "Generate Preview" to see the output</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleExport} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Download {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
