# 📤 Export Functionality - Complete Implementation

## Current Status
❌ **NOT IMPLEMENTED** - Cần add từ đầu

## Required Features

### 1. Export to Image (PNG/SVG)
### 2. Export to PDF
### 3. Export Data (JSON/GEDCOM)
### 4. Print View

---

## 🎨 Implementation: Export to Image

**Using `html-to-image` library:**

```bash
npm install html-to-image
npm install file-saver
npm install --save-dev @types/file-saver
```

```tsx
// components/ExportMenu.tsx
'use client'

import { useState } from 'react'
import { toPng, toSvg } from 'html-to-image'
import { saveAs } from 'file-saver'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Download, FileImage, FileText, Database } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import type { Person, Relationship } from '@/types/supabase'

interface ExportMenuProps {
  persons: Person[]
  relationships: Relationship[]
  treeRef: React.RefObject<HTMLDivElement> // ReactFlow container ref
}

export function ExportMenu({ persons, relationships, treeRef }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Export to PNG
  const exportToPNG = async () => {
    if (!treeRef.current) return
    
    setIsExporting(true)
    try {
      const dataUrl = await toPng(treeRef.current, {
        quality: 1,
        pixelRatio: 2, // Higher quality
        backgroundColor: '#ffffff',
      })
      
      saveAs(dataUrl, `family-tree-${Date.now()}.png`)
      
      toast({
        title: 'Success',
        description: 'Tree exported as PNG',
      })
    } catch (error) {
      console.error('Error exporting PNG:', error)
      toast({
        title: 'Error',
        description: 'Failed to export PNG',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Export to SVG
  const exportToSVG = async () => {
    if (!treeRef.current) return
    
    setIsExporting(true)
    try {
      const dataUrl = await toSvg(treeRef.current, {
        backgroundColor: '#ffffff',
      })
      
      saveAs(dataUrl, `family-tree-${Date.now()}.svg`)
      
      toast({
        title: 'Success',
        description: 'Tree exported as SVG',
      })
    } catch (error) {
      console.error('Error exporting SVG:', error)
      toast({
        title: 'Error',
        description: 'Failed to export SVG',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Export to PDF
  const exportToPDF = async () => {
    if (!treeRef.current) return
    
    setIsExporting(true)
    try {
      // First convert to PNG
      const dataUrl = await toPng(treeRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      })
      
      // Then use jsPDF
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: 'a4',
      })
      
      const img = new Image()
      img.src = dataUrl
      
      img.onload = () => {
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = img.width
        const imgHeight = img.height
        
        // Calculate scaling to fit page
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
        const scaledWidth = imgWidth * ratio
        const scaledHeight = imgHeight * ratio
        
        // Center the image
        const x = (pdfWidth - scaledWidth) / 2
        const y = (pdfHeight - scaledHeight) / 2
        
        pdf.addImage(dataUrl, 'PNG', x, y, scaledWidth, scaledHeight)
        pdf.save(`family-tree-${Date.now()}.pdf`)
        
        toast({
          title: 'Success',
          description: 'Tree exported as PDF',
        })
        setIsExporting(false)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive',
      })
      setIsExporting(false)
    }
  }

  // Export Data as JSON
  const exportToJSON = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      persons: persons.map((p) => ({
        id: p.id,
        name: p.name,
        dateOfBirth: p.date_of_birth,
        gender: p.gender,
        createdAt: p.created_at,
      })),
      relationships: relationships.map((r) => ({
        id: r.id,
        parentId: r.parent_id,
        childId: r.child_id,
        type: r.relationship_type,
      })),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    
    saveAs(blob, `family-tree-data-${Date.now()}.json`)
    
    toast({
      title: 'Success',
      description: 'Data exported as JSON',
    })
  }

  // Export to GEDCOM (genealogy standard format)
  const exportToGEDCOM = () => {
    const gedcom = generateGEDCOM(persons, relationships)
    
    const blob = new Blob([gedcom], {
      type: 'text/plain',
    })
    
    saveAs(blob, `family-tree-${Date.now()}.ged`)
    
    toast({
      title: 'Success',
      description: 'Data exported as GEDCOM',
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Tree</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={exportToPNG}>
          <FileImage className="mr-2 h-4 w-4" />
          Export as PNG
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportToSVG}>
          <FileImage className="mr-2 h-4 w-4" />
          Export as SVG
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Export Data</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={exportToJSON}>
          <Database className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportToGEDCOM}>
          <FileText className="mr-2 h-4 w-4" />
          Export as GEDCOM
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// GEDCOM Generator
function generateGEDCOM(persons: Person[], relationships: Relationship[]): string {
  let gedcom = `0 HEAD
1 SOUR Glean Family Tree
2 VERS 2.0
2 NAME Glean Family Tree V2
1 DATE ${new Date().toISOString().split('T')[0].replace(/-/g, '')}
1 CHAR UTF-8
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
`

  // Add individuals
  persons.forEach((person, index) => {
    const personId = `@I${index + 1}@`
    
    gedcom += `0 ${personId} INDI
1 NAME ${person.name}
`
    
    if (person.gender) {
      gedcom += `1 SEX ${person.gender === 'male' ? 'M' : person.gender === 'female' ? 'F' : 'U'}
`
    }
    
    if (person.date_of_birth) {
      const [year, month, day] = person.date_of_birth.split('-')
      gedcom += `1 BIRT
2 DATE ${day} ${getMonthName(month)} ${year}
`
    }
  })

  // Add families (parent-child relationships)
  const families = new Map<string, Set<string>>() // parent -> children
  
  relationships
    .filter((r) => r.relationship_type === 'parent-child')
    .forEach((rel) => {
      if (!families.has(rel.parent_id)) {
        families.set(rel.parent_id, new Set())
      }
      families.get(rel.parent_id)!.add(rel.child_id)
    })

  let familyIndex = 1
  families.forEach((children, parentId) => {
    const familyId = `@F${familyIndex++}@`
    const parentIndex = persons.findIndex((p) => p.id === parentId) + 1
    
    gedcom += `0 ${familyId} FAM
1 HUSB @I${parentIndex}@
`
    
    children.forEach((childId) => {
      const childIndex = persons.findIndex((p) => p.id === childId) + 1
      gedcom += `1 CHIL @I${childIndex}@
`
    })
  })

  gedcom += `0 TRLR
`

  return gedcom
}

function getMonthName(month: string): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return months[parseInt(month) - 1] || 'JAN'
}
```

**Update FamilyTree.tsx to support ref:**

```tsx
// components/FamilyTree.tsx
import { forwardRef } from 'react'

export const FamilyTree = forwardRef<HTMLDivElement, FamilyTreeProps>(
  ({ persons, relationships }, ref) => {
    // ... existing code
    
    return (
      <div ref={ref} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          // ...
        />
      </div>
    )
  }
)

FamilyTree.displayName = 'FamilyTree'
```

**Usage in Dashboard:**

```tsx
// app/dashboard/DashboardClient.tsx
import { useRef } from 'react'
import { ExportMenu } from '@/components/ExportMenu'

export function DashboardClient({ ... }) {
  const treeRef = useRef<HTMLDivElement>(null)
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <ExportMenu
          persons={persons}
          relationships={relationships}
          treeRef={treeRef}
        />
      </div>
      
      <FamilyTree
        ref={treeRef}
        persons={persons}
        relationships={relationships}
      />
    </div>
  )
}
```

---

## 📄 Print-Friendly View

```tsx
// components/PrintView.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button onClick={handlePrint} variant="outline">
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  )
}
```

**Add print styles:**

```css
/* globals.css */

@media print {
  /* Hide navigation and controls */
  aside,
  header,
  button,
  .no-print {
    display: none !important;
  }

  /* Make tree full page */
  main {
    width: 100% !important;
    height: 100% !important;
    overflow: visible !important;
  }

  /* Ensure connections visible */
  .react-flow__edge-path {
    stroke: #000 !important;
    stroke-width: 2px !important;
  }

  /* Optimize nodes for print */
  .react-flow__node {
    break-inside: avoid !important;
  }

  /* Page breaks */
  @page {
    size: landscape;
    margin: 1cm;
  }
}
```

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "html-to-image": "^1.11.11",
    "file-saver": "^2.0.5",
    "jspdf": "^2.5.1"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.5"
  }
}
```

```bash
npm install html-to-image file-saver jspdf
npm install --save-dev @types/file-saver
```

---

## 🎯 Testing Checklist

### PNG Export
- [ ] Image contains entire tree
- [ ] High resolution (2x pixel ratio)
- [ ] White background
- [ ] All connections visible
- [ ] Text readable

### SVG Export
- [ ] Scalable without quality loss
- [ ] Opens in browser/Illustrator
- [ ] Colors preserved

### PDF Export
- [ ] Landscape orientation
- [ ] Tree fits on page
- [ ] Maintains aspect ratio
- [ ] Professional quality

### JSON Export
- [ ] Valid JSON format
- [ ] All persons included
- [ ] All relationships included
- [ ] Can be re-imported

### GEDCOM Export
- [ ] Valid GEDCOM 5.5.1 format
- [ ] Opens in other genealogy software
- [ ] Names, dates preserved
- [ ] Relationships intact

### Print
- [ ] Controls hidden
- [ ] Tree fills page
- [ ] Landscape orientation
- [ ] Professional appearance

---

## 🔄 Import Functionality (Bonus)

```tsx
// components/ImportMenu.tsx
'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useImportData } from '@/lib/supabase/queries'

export function ImportButton() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importData = useImportData()

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      await importData.mutateAsync(data)
      
      toast({
        title: 'Success',
        description: `Imported ${data.persons.length} persons`,
      })
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: 'Error',
        description: 'Failed to import data',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
      >
        <Upload className="mr-2 h-4 w-4" />
        Import JSON
      </Button>
    </>
  )
}
```

---

## 🚀 Implementation Order

1. **Phase 1:** PNG/SVG export (most requested)
2. **Phase 2:** PDF export (professional use)
3. **Phase 3:** JSON export/import (data backup)
4. **Phase 4:** GEDCOM export (compatibility)
5. **Phase 5:** Print view (convenience)

**Estimated time:** 1-2 days for all features
