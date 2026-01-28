import dagre from 'dagre'
import { Node, Edge, Position } from 'reactflow'

const nodeWidth = 200
const nodeHeight = 50
const spouseGap = 50 // Khoảng cách giữa các spouse

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
    // Calculate total width of the group
    // We consider the group as [Main Person] + [Spouse 1] + [Spouse 2] ...
    // Wait, typically it's pairs. But if multiple spouses, we group them.
    // Let's assume the main person is the "anchor" from dagre layout.
    
    // Simple strategy: Keep the main person at basePos, place spouses to the right.
    // Or center the group around basePos?
    // Let's stick to "Main person at calculated position, spouses to the right" for simplicity unless it overlaps.
    // But if we center the group, it looks better.
    
    // Let's gather the whole group (person + spouses)
    const group = [personId, ...spouses]
    // Filter out those already positioned to avoid double moving (though spouses check should handle it)
    // Actually, we should only position if we encounter the "left-most" or "primary" one?
    // But dagre gives positions for everyone.
    
    // Let's trust dagre for vertical rank, but override horizontal.
    // We need to pick one "anchor" node to define the group's center.
    // Usually dagre places connected nodes close.
    
    // Let's use the logic from the previous attempt: Center the group.
    
    const groupSize = group.length
    const totalGroupWidth = groupSize * nodeWidth + (groupSize - 1) * spouseGap
    
    // Use the position of the personId as the center reference? 
    // Or average of all group members?
    // Let's use personId's position as the center of the group for now.
    
    const startX = basePos.x - totalGroupWidth / 2 + nodeWidth / 2
    
    group.forEach((memberId, index) => {
      if (positioned.has(memberId)) return
      
      const memberIndex = newNodes.findIndex(n => n.id === memberId)
      if (memberIndex >= 0) {
        newNodes[memberIndex] = {
          ...newNodes[memberIndex],
          position: {
            x: startX + index * (nodeWidth + spouseGap),
            y: basePos.y
          }
        }
        positioned.add(memberId)
      }
    })
  })
  
  return newNodes
}

export function syncSpouseData(nodes: Node[], edges: Edge[]) {
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

  // Update edges with proper handle IDs for spouse connections
  // Ensure direction is always Left -> Right to match handles
  const updatedEdges = edges.map((edge) => {
    const isSpouse = edge.data?.relationshipType === 'spouse'
    if (!isSpouse) {
      const sharedChild = edge.data?.sharedChild && Array.isArray(edge.data?.spousePair)
      if (sharedChild) {
        const [parentA, parentB] = edge.data.spousePair as [string, string]
        const nodeA = nodesWithSpouseData.find(n => n.id === parentA)
        const nodeB = nodesWithSpouseData.find(n => n.id === parentB)
        if (nodeA?.position && nodeB?.position) {
          const centerA = nodeA.position.x + nodeWidth / 2
          const centerB = nodeB.position.x + nodeWidth / 2
          const centerX = (centerA + centerB) / 2
          const bottomA = nodeA.position.y + nodeHeight
          const bottomB = nodeB.position.y + nodeHeight
          const bottomY = Math.max(bottomA, bottomB)
          return {
            ...edge,
            data: {
              ...edge.data,
              sourceX: centerX,
              sourceY: bottomY,
            },
          }
        }
      }
      return edge
    }

    const hasStoredHandles = !!edge.sourceHandle || !!edge.targetHandle
    if (hasStoredHandles) {
      return {
        ...edge,
        sourceHandle: edge.sourceHandle ?? 'spouse-right',
        targetHandle: edge.targetHandle ?? 'spouse-left',
        type: 'spouse',
      }
    }

    const sourceNode = nodesWithSpouseData.find(n => n.id === edge.source)
    const targetNode = nodesWithSpouseData.find(n => n.id === edge.target)

    let finalSource = edge.source
    let finalTarget = edge.target

    if (sourceNode?.position && targetNode?.position) {
      if (sourceNode.position.x > targetNode.position.x) {
        finalSource = edge.target
        finalTarget = edge.source
      }
    }

    return {
      ...edge,
      source: finalSource,
      target: finalTarget,
      sourceHandle: 'spouse-right',
      targetHandle: 'spouse-left',
      type: 'spouse',
    }
  })

  return { nodes: nodesWithSpouseData, edges: updatedEdges }
}

export function updateSharedChildEdges(nodes: Node[], edges: Edge[]) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  return edges.map((edge) => {
    const sharedChild = edge.data?.sharedChild && Array.isArray(edge.data?.spousePair)
    if (!sharedChild) return edge

    const [parentA, parentB] = edge.data.spousePair as [string, string]
    const nodeA = nodeById.get(parentA)
    const nodeB = nodeById.get(parentB)
    if (!nodeA?.position || !nodeB?.position) return edge

    const centerA = nodeA.position.x + nodeWidth / 2
    const centerB = nodeB.position.x + nodeWidth / 2
    const centerX = (centerA + centerB) / 2
    const bottomA = nodeA.position.y + nodeHeight
    const bottomB = nodeB.position.y + nodeHeight
    const bottomY = Math.max(bottomA, bottomB)

    return {
      ...edge,
      data: {
        ...edge.data,
        sourceX: centerX,
        sourceY: bottomY,
      },
    }
  })
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

  // Add spouse count to node data for initial layout considerations if needed
  // (Though dagre doesn't know about our internal data, we just pass nodes)
  
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  // Add parent-child edges (exclude spouse edges from hierarchy to avoid cycles or weird levels)
  // Spouse edges should be on the same rank.
  edges.forEach((edge) => {
    const isSpouse = edge.data?.relationshipType === 'spouse'
    if (!isSpouse) {
      dagreGraph.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(dagreGraph)

  // Get base positions from dagre
  const basePositions = new Map<string, { x: number; y: number }>()
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    if (nodeWithPosition) {
      basePositions.set(node.id, {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y
      })
    }
  })

  // Initial positioning based on Dagre
  let positionedNodes = nodes.map((node) => {
    const pos = basePositions.get(node.id)
    // Fallback if dagre didn't position it (e.g. disconnected)
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

  // Sync spouse data (update handles and node data) and return
  // This step ensures the edges point to the correct handles based on the final positions
  return syncSpouseData(positionedNodes, edges)
}
