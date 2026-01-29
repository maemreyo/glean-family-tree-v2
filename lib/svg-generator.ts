import { Node, Edge } from 'reactflow'

export interface PrintData {
  nodes: Node[]
  edges: Edge[]
  width: number
  height: number
  title?: string
}

export function generateSVG(data: PrintData): string {
  const { nodes, edges, width, height, title } = data
  
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
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          .node-rect { fill: white; stroke: #000; stroke-width: 2px; rx: 8px; }
          .node-text { font-family: 'Inter', sans-serif; fill: #000; }
          .node-name { font-weight: 700; font-size: 16px; }
          .node-detail { font-weight: 400; font-size: 12px; fill: #555; }
          .edge-path { fill: none; stroke: #000; stroke-width: 2px; }
          .title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 48px; fill: #000; }
        </style>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#000" />
        </marker>
      </defs>
      
      <!-- Background -->
      <rect x="${minX}" y="${minY}" width="${contentWidth}" height="${contentHeight}" fill="#fff" />
      
      <!-- Title -->
      ${title ? `<text x="${minX + contentWidth / 2}" y="${minY + 80}" text-anchor="middle" class="title">${title}</text>` : ''}
      
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
           const photoUrl = data.photoUrl
           // Note: external images in SVG might not render if CORS blocks or if converted to PDF without embedding.
           // Ideally convert to base64 if possible, but for now just link.
           
           return `
             <g transform="translate(${x}, ${y})">
               <rect width="${w}" height="${h}" class="node-rect" />
               
               ${photoUrl ? `
                 <image href="${photoUrl}" x="10" y="10" width="60" height="60" preserveAspectRatio="xMidYMid slice" clip-path="circle(30px at 40px 40px)" />
               ` : ''}
               
               <text x="${photoUrl ? 80 : 10}" y="30" class="node-text node-name">
                 ${escapeXml(data.label || 'Unknown')}
               </text>
               
               <text x="${photoUrl ? 80 : 10}" y="50" class="node-text node-detail">
                 ${data.gender ? capitalize(data.gender) : ''}
               </text>
               
               <text x="${photoUrl ? 80 : 10}" y="70" class="node-text node-detail">
                 ${formatDate(data.dateOfBirth)} - ${formatDate(data.dateOfDeath)}
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
