import { NextRequest, NextResponse } from 'next/server'
import { generateSVG, PrintData } from '@/lib/svg-generator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as PrintData
    
    // Validate body
    if (!body.nodes || !body.edges) {
      return NextResponse.json({ error: 'Missing nodes or edges' }, { status: 400 })
    }
    
    // Set default A0 dimensions @ 300 DPI if not provided
    // 841mm x 1189mm -> 33.11in x 46.81in -> 9933px x 14043px
    const width = body.width || 9933
    const height = body.height || 14043
    
    const svgContent = generateSVG({
      ...body,
      width,
      height
    })
    
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="family-tree-print.svg"`,
      },
    })
  } catch (error) {
    console.error('Error generating SVG:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
