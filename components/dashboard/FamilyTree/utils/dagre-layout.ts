import dagre from 'dagre'
import { Node, Edge, Position } from 'reactflow'

const DEFAULT_NODE_WIDTH = 200
const DEFAULT_NODE_HEIGHT = 50
const SPOUSE_GAP = 50 // Khoảng cách giữa các spouse

interface LayoutOptions {
  direction?: string
  nodeWidth?: number
  nodeHeight?: number
}

// Legacy helper for adjacency (used in syncSpouseData)
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

// New helper for clustering connected components of spouses
function getSpouseClusters(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const clusters = new Map<string, string[]>()
  const visited = new Set<string>()
  const adj = new Map<string, string[]>()

  // Build adjacency list for spouse edges
  edges.forEach(edge => {
    if (edge.data?.relationshipType === 'spouse') {
      if (!adj.has(edge.source)) adj.set(edge.source, [])
      if (!adj.has(edge.target)) adj.set(edge.target, [])
      adj.get(edge.source)!.push(edge.target)
      adj.get(edge.target)!.push(edge.source)
    }
  })

  // Find connected components
  nodes.forEach(node => {
    if (visited.has(node.id)) return
    
    const clusterNodes: string[] = []
    const queue = [node.id]
    visited.add(node.id)
    
    while (queue.length > 0) {
      const curr = queue.shift()!
      clusterNodes.push(curr)
      
      const neighbors = adj.get(curr) || []
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push(neighbor)
        }
      })
    }
    
    // Sort by ID to ensure deterministic order within cluster
    clusterNodes.sort()
    
    // Use first node as Representative
    clusters.set(clusterNodes[0], clusterNodes)
  })
  
  return clusters
}

export function syncSpouseData(nodes: Node[], edges: Edge[], options: LayoutOptions = {}) {
  const { nodeWidth = DEFAULT_NODE_WIDTH, nodeHeight = DEFAULT_NODE_HEIGHT } = options
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

    // Always recalculate spouse handles to ensure Inner-to-Inner connection
    // ignoring stored handles which might be stale after layout swap
    
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

export function updateSharedChildEdges(nodes: Node[], edges: Edge[], options: LayoutOptions = {}) {
  const { nodeWidth = DEFAULT_NODE_WIDTH, nodeHeight = DEFAULT_NODE_HEIGHT } = options
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

export function getLayoutedElements(nodes: Node[], edges: Edge[], options: LayoutOptions = {}) {
  const { direction = 'TB', nodeWidth = DEFAULT_NODE_WIDTH, nodeHeight = DEFAULT_NODE_HEIGHT } = options
  
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 80,
    ranksep: 100,
    edgesep: 50,
  })

  // 1. Get Clusters
  const clusters = getSpouseClusters(nodes, edges)
  const nodeToRep = new Map<string, string>()
  clusters.forEach((members, repId) => {
    members.forEach(m => nodeToRep.set(m, repId))
  })

  // 2. Add Reps to Dagre with compound width
  clusters.forEach((members, repId) => {
    const width = members.length * nodeWidth + (members.length - 1) * SPOUSE_GAP
    dagreGraph.setNode(repId, { width, height: nodeHeight })
  })

  // 3. Add Edges (mapped to Reps)
  // We only add edges between different clusters
  const addedEdges = new Set<string>()
  
  edges.forEach((edge) => {
    const isSpouse = edge.data?.relationshipType === 'spouse'
    if (!isSpouse) {
      const sourceRep = nodeToRep.get(edge.source)
      const targetRep = nodeToRep.get(edge.target)
      
      if (sourceRep && targetRep && sourceRep !== targetRep) {
        // Avoid duplicate edges between same clusters to keep graph clean
        const edgeKey = `${sourceRep}-${targetRep}`
        if (!addedEdges.has(edgeKey)) {
          dagreGraph.setEdge(sourceRep, targetRep)
          addedEdges.add(edgeKey)
        }
      }
    }
  })

  dagre.layout(dagreGraph)

  // 4. Distribute Positions
  const positionedNodes: Node[] = []
  
  clusters.forEach((members, repId) => {
    const dagreNode = dagreGraph.node(repId)
    // If dagre didn't position it (disconnected node?), we should have a fallback.
    // But dagre handles disconnected nodes too.
    
    if (dagreNode) {
      // SMART SORTING: Sort members based on average X of neighbors
      const memberScores = members.map(memberId => {
        let totalX = 0
        let count = 0
        
        // Find connected nodes
        edges.forEach(edge => {
          if (edge.data?.relationshipType === 'spouse') return // Ignore spouse edges for sorting
          
          let otherId: string | null = null
          if (edge.source === memberId) otherId = edge.target
          else if (edge.target === memberId) otherId = edge.source
          
          if (otherId) {
             // Find representative of other node
             const otherRep = nodeToRep.get(otherId)
             if (otherRep && otherRep !== repId) {
                const otherPos = dagreGraph.node(otherRep)
                if (otherPos) {
                   totalX += otherPos.x
                   count++
                }
             }
          }
        })
        
        return { 
          id: memberId, 
          score: count > 0 ? totalX / count : 0,
          hasConnections: count > 0
        }
      })
      
      // Sort: Nodes with connections to left go left.
      // If no connections, fallback to ID sort (already sorted by getSpouseClusters).
      // We only sort if at least one has connections.
      if (memberScores.some(m => m.hasConnections)) {
         memberScores.sort((a, b) => {
            if (a.hasConnections && !b.hasConnections) return -1 // Connected go left? Or keep default? 
            // Actually, if a has connections (avgX), it should be placed near avgX.
            // But we are placing them in a horizontal row centered at dagreNode.x.
            // Lower avgX -> Left. Higher avgX -> Right.
            // If b has no connections, where to put? Maybe neutral (0)?
            // Better: Treat no connections as "neutral" or keep relative order.
            
            if (a.hasConnections && b.hasConnections) {
                return a.score - b.score
            }
            // If one has connections and other doesn't...
            // Maybe just put connected ones on the side of their connections?
            // Simple: just sort by score, defaulting 0. 
            // But 0 is "Left". If AvgX is 500, 0 is very left.
            // We should use dagreNode.x as "neutral" score?
            const aScore = a.hasConnections ? a.score : dagreNode.x
            const bScore = b.hasConnections ? b.score : dagreNode.x
            return aScore - bScore
         })
         
         // Re-order members array based on sort
         members = memberScores.map(m => m.id)
      }

      const totalWidth = members.length * nodeWidth + (members.length - 1) * SPOUSE_GAP
      const startX = dagreNode.x - totalWidth / 2
      const startY = dagreNode.y - nodeHeight / 2

      members.forEach((memberId, index) => {
        const originalNode = nodes.find(n => n.id === memberId)
        if (!originalNode) return

        positionedNodes.push({
          ...originalNode,
          targetPosition: isHorizontal ? Position.Left : Position.Top,
          sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
          position: {
            x: startX + index * (nodeWidth + SPOUSE_GAP),
            y: startY
          },
          width: nodeWidth,
          height: nodeHeight,
        })
      })
    } else {
        // Fallback for nodes that somehow missed layout (should not happen)
        members.forEach(memberId => {
             const originalNode = nodes.find(n => n.id === memberId)
             if(originalNode) positionedNodes.push(originalNode)
        })
    }
  })

  // 5. Sync Spouse Data (Handles)
  return syncSpouseData(positionedNodes, edges, options)
}
