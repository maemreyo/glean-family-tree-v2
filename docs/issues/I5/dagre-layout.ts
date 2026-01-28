import dagre from 'dagre'
import { Node, Edge, Position } from 'reactflow'

const nodeWidth = 200
const nodeHeight = 50
const spouseGap = 50 // Khoảng cách giữa các spouse

interface SpouseGroup {
  personId: string
  spouses: string[]
}

function findSpouseGroups(edges: Edge[]): Map<string, string[]> {
  const spouseMap = new Map<string, string[]>()
  
  edges.forEach((edge) => {
    const isSpouse = edge.data?.relationshipType === 'spouse'
    if (isSpouse) {
      const source = edge.source
      const target = edge.target
      
      // Add bidirectional spouse relationship
      if (!spouseMap.has(source)) spouseMap.set(source, [])
      if (!spouseMap.has(target)) spouseMap.set(target, [])
      
      if (!spouseMap.get(source)!.includes(target)) {
        spouseMap.get(source)!.push(target)
      }
      if (!spouseMap.get(target)!.includes(source)) {
        spouseMap.get(target)!.push(source)
      }
    }
  })
  
  return spouseMap
}

function positionSpousesHorizontally(
  nodes: Node[],
  spouseMap: Map<string, string[]>,
  basePositions: Map<string, { x: number; y: number }>
): Node[] {
  const positioned = new Set<string>()
  const newNodes = [...nodes]
  
  // Process each person who has spouses
  spouseMap.forEach((spouses, personId) => {
    if (positioned.has(personId)) return
    
    const basePos = basePositions.get(personId)
    if (!basePos) return
    
    // For multiple spouses, arrange them horizontally
    const totalSpouses = spouses.length
    const totalWidth = totalSpouses * nodeWidth + (totalSpouses - 1) * spouseGap
    
    // Position main person
    const mainNodeIndex = newNodes.findIndex(n => n.id === personId)
    if (mainNodeIndex >= 0) {
      newNodes[mainNodeIndex] = {
        ...newNodes[mainNodeIndex],
        position: {
          x: basePos.x - totalWidth / 2,
          y: basePos.y
        }
      }
      positioned.add(personId)
    }
    
    // Position spouses to the right
    spouses.forEach((spouseId, index) => {
      if (positioned.has(spouseId)) return
      
      const spouseNodeIndex = newNodes.findIndex(n => n.id === spouseId)
      if (spouseNodeIndex >= 0) {
        newNodes[spouseNodeIndex] = {
          ...newNodes[spouseNodeIndex],
          position: {
            x: basePos.x - totalWidth / 2 + (index + 1) * (nodeWidth + spouseGap),
            y: basePos.y
          }
        }
        positioned.add(spouseId)
      }
    })
  })
  
  return newNodes
}

export function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 80,
    ranksep: 100,
    edgesep: 50,
  })

  // Find spouse relationships
  const spouseMap = findSpouseGroups(edges)
  
  // Add spouse count to node data
  const nodesWithSpouseData = nodes.map((node) => {
    const spouses = spouseMap.get(node.id) || []
    const spouseNames = spouses
      .map(spouseId => {
        const spouseNode = nodes.find(n => n.id === spouseId)
        return spouseNode?.data?.label || ''
      })
      .filter(Boolean)
      .join(', ')
    
    return {
      ...node,
      data: {
        ...node.data,
        spouseCount: spouses.length,
        spouseNames: spouseNames || undefined,
      }
    }
  })

  // Add nodes to dagre (treat spouse pairs as single unit for layout)
  const processedForLayout = new Set<string>()
  nodesWithSpouseData.forEach((node) => {
    if (processedForLayout.has(node.id)) return
    
    const spouses = spouseMap.get(node.id) || []
    
    if (spouses.length > 0) {
      // For people with spouses, use a wider virtual node
      const virtualWidth = nodeWidth * (spouses.length + 1) + spouseGap * spouses.length
      dagreGraph.setNode(node.id, { width: virtualWidth, height: nodeHeight })
      
      // Mark spouses as processed so they don't get added separately
      spouses.forEach(spouseId => processedForLayout.add(spouseId))
      processedForLayout.add(node.id)
    } else {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
      processedForLayout.add(node.id)
    }
  })

  // Add parent-child edges (exclude spouse edges from hierarchy)
  edges.forEach((edge) => {
    const isSpouse = edge.data?.relationshipType === 'spouse'
    if (!isSpouse) {
      // For parent-child relationships, use the "family unit" as source if parent has spouse
      const sourceSpouses = spouseMap.get(edge.source) || []
      dagreGraph.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(dagreGraph)

  // Get base positions from dagre
  const basePositions = new Map<string, { x: number; y: number }>()
  nodesWithSpouseData.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    if (nodeWithPosition) {
      basePositions.set(node.id, {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y
      })
    }
  })

  // Position nodes with spouse grouping
  let positionedNodes = nodesWithSpouseData.map((node) => {
    const pos = basePositions.get(node.id)
    if (!pos) return node
    
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2,
      },
    }
  })
  
  // Adjust positions to place spouses horizontally next to each other
  positionedNodes = positionSpousesHorizontally(positionedNodes, spouseMap, basePositions)

  // Update edges with proper handle IDs for spouse connections
  const updatedEdges = edges.map((edge) => {
    const isSpouse = edge.data?.relationshipType === 'spouse'
    if (isSpouse) {
      return {
        ...edge,
        sourceHandle: 'spouse-right',
        targetHandle: 'spouse-left',
        type: 'spouse', // Use custom spouse edge
      }
    }
    return edge
  })

  return { nodes: positionedNodes, edges: updatedEdges }
}
