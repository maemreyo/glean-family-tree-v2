import { create } from 'zustand'

interface TreeState {
  nodes: any[]
  edges: any[]
  setNodes: (nodes: any[]) => void
  setEdges: (edges: any[]) => void
}

export const useTreeStore = create<TreeState>((set) => ({
  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}))
