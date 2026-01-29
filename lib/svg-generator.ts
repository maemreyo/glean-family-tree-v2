import { Node, Edge } from 'reactflow'

export interface PrintData {
  nodes: Node[]
  edges: Edge[]
  width: number
  height: number
  title?: string
  displayMode?: string
}

export function generateSVG(data: PrintData): string {
  const { nodes, edges, width, height, title, displayMode = 'default' } = data
  
  // A0 size at 96 DPI (screen) is approx 3179 x 4494 pixels
  // A0 size at 300 DPI (print) is approx 9933 x 14043 pixels
  // We use the ViewBox to scale content to the requested size
  
  // Calculate bounding box of the graph to set viewBox
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  
  nodes.forEach(node => {
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + (node.width || 200))
    maxY = Math.max(maxY, node.position.y + (node.height || 100))
  })
  
  // Add some padding
  const padding = 100
  minX -= padding
  minY -= padding
  maxX += padding
  maxY += padding
  
  const contentWidth = maxX - minX
  const contentHeight = maxY - minY
  
  // Generate SVG content
  const svgContent = `
    <svg width="${width}" height="${height}" viewBox="${minX} ${minY} ${contentWidth} ${contentHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;display=swap');
          .node-rect { fill: white; stroke: #e2e8f0; stroke-width: 1px; rx: 8px; }
          .node-text { font-family: 'Inter', sans-serif; fill: #0f172a; }
          .node-name { font-weight: 600; font-size: 14px; }
          .node-detail { font-weight: 400; font-size: 10px; fill: #64748b; }
          .edge-path { fill: none; stroke: #94a3b8; stroke-width: 2px; }
          .title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 48px; fill: #0f172a; }
          
          /* Portrait Mode Styles */
          .portrait-rect { fill: #f8fafc; stroke: none; rx: 0; }
          .portrait-name { font-weight: 700; font-size: 14px; fill: white; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
          .portrait-detail { font-size: 10px; fill: rgba(255,255,255,0.9); text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
          .portrait-gradient { fill: url(#portrait-gradient); }
        </style>
        <linearGradient id="portrait-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
          <stop offset="60%" stop-color="rgba(0,0,0,0.6)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.9)"/>
        </linearGradient>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>
      
      <!-- Background -->
      <rect x="${minX}" y="${minY}" width="${contentWidth}" height="${contentHeight}" fill="#fff" />
      
      <!-- Title -->
      ${title ? `<text x="${minX + contentWidth / 2}" y="${minY + 80}" text-anchor="middle" class="title">${escapeXml(title)}</text>` : ''}
      
      <!-- Edges -->
      <g>
        ${edges.map(edge => {
          // If edge has points (smooth step or bezier), use them. Otherwise draw straight line.
          // ReactFlow edges usually don't have path data in the object unless we calculate it.
          // For simplicity in server-side gen, we might need to recalculate path or pass it from client.
          // Assuming simple straight lines or basic step path for now if data is missing.
          
          // But wait, the client usually passes the edge object which doesn't contain the full path string unless we use getBezierPath.
          // If we want high fidelity, we should calculate the path here based on source/target handles.
          // Let's assume standard Bezier or Step for genealogy.
          
          const sourceNode = nodes.find(n => n.id === edge.source)
          const targetNode = nodes.find(n => n.id === edge.target)
          
          if (!sourceNode || !targetNode) return ''
          
          // Simple center-to-center or handle-to-handle logic
          // Default Dagre layout usually connects bottom to top
          const sx = sourceNode.position.x + (sourceNode.width || 200) / 2
          const sy = sourceNode.position.y + (sourceNode.height || 100)
          const tx = targetNode.position.x + (targetNode.width || 200) / 2
          const ty = targetNode.position.y
          
          // Cubic Bezier
          const c1x = sx
          const c1y = sy + 50
          const c2x = tx
          const c2y = ty - 50
          
          const d = `M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${tx},${ty}`
          
          return `<path d="${d}" class="edge-path" marker-end="url(#arrowhead)" />`
        }).join('')}
      </g>
      
      <!-- Nodes -->
      <g>
        ${nodes.map(node => {
           const w = node.width || 200
           const h = node.height || 100 // Increased height for print
           const x = node.position.x
           const y = node.position.y
           const data = node.data as any
           
           // Check for photo
           const photoUrl = data.photoUrl ? escapeXml(data.photoUrl) : null
           
           if (displayMode === 'portrait') {
             return `
               <g transform="translate(${x}, ${y})">
                 <!-- Clip path for image -->
                 <defs>
                   <clipPath id="clip-${node.id}">
                     <rect width="${w}" height="${h}" rx="0" />
                   </clipPath>
                 </defs>
                 
                 <rect width="${w}" height="${h}" class="portrait-rect" />
                 
                 ${photoUrl ? `
                   <image href="${photoUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${node.id})" />
                 ` : `
                   <rect width="${w}" height="${h}" fill="#f1f5f9" />
                   <circle cx="${w/2}" cy="${h/2 - 20}" r="30" fill="#cbd5e1" />
                   <circle cx="${w/2}" cy="${h/2 - 35}" r="12" fill="#f1f5f9" />
                   <path d="M${w/2-30} ${h/2+10} Q${w/2} ${h/2-20} ${w/2+30} ${h/2+10} v30 h-60 z" fill="#f1f5f9" />
                 `}
                 
                 <!-- Gradient Overlay -->
                 <rect x="0" y="${h * 0.5}" width="${w}" height="${h * 0.5}" class="portrait-gradient" />
                 
                 <!-- Text -->
                 <text x="10" y="${h - 35}" class="node-text portrait-name">
                   ${escapeXml(data.label || 'Unknown')}
                 </text>
                 
                 <text x="10" y="${h - 15}" class="node-text portrait-detail">
                   ${formatDate(data.date_of_birth || data.dateOfBirth)} - ${formatDate(data.date_of_death || data.dateOfDeath)}
                 </text>
               </g>
             `
           }
           
           if (displayMode === 'compact') {
             return `
               <g transform="translate(${x}, ${y})">
                 <rect width="${w}" height="${h}" class="node-rect" rx="4" />
                 <text x="${w/2}" y="${h/2 + 5}" text-anchor="middle" class="node-text node-name" style="font-size: 12px;">
                   ${escapeXml(data.label || 'Unknown')}
                 </text>
               </g>
             `
           }
           
           // Default / Detailed Mode
           return `
             <g transform="translate(${x}, ${y})">
               <rect width="${w}" height="${h}" class="node-rect" />
               
               ${photoUrl ? `
                 <image href="${photoUrl}" x="10" y="10" width="${h-20}" height="${h-20}" preserveAspectRatio="xMidYMid slice" clip-path="circle(${(h-20)/2}px at ${10 + (h-20)/2}px ${10 + (h-20)/2}px)" />
               ` : ''}
               
               <text x="${photoUrl ? h + 5 : 10}" y="${h/2 - 5}" class="node-text node-name">
                 ${escapeXml(data.label || 'Unknown')}
               </text>
               
               <text x="${photoUrl ? h + 5 : 10}" y="${h/2 + 12}" class="node-text node-detail">
                 ${formatDate(data.date_of_birth || data.dateOfBirth)} - ${formatDate(data.date_of_death || data.dateOfDeath)}
               </text>
             </g>
           `
        }).join('')}
      </g>
    </svg>
  `
  
  return svgContent
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
    }
    return c
  })
}

function capitalize(s: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(d: string | null): string {
  if (!d) return '?'
  return new Date(d).getFullYear().toString()
}
