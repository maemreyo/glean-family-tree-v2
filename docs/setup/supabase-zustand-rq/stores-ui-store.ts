// stores/ui-store.ts
import { createStore } from 'zustand/vanilla'

/**
 * UI Store Type Definition
 * 
 * Store này quản lý tất cả UI state không liên quan đến server data
 */
export type UIStore = {
  // Sidebar state
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Person detail modal
  selectedPersonId: string | null
  openPersonModal: (id: string) => void
  closePersonModal: () => void

  // Family tree view state
  treeZoom: number
  setTreeZoom: (zoom: number) => void
  treePosition: { x: number; y: number }
  setTreePosition: (pos: { x: number; y: number }) => void
  resetTreeView: () => void

  // Form state
  isFormDirty: boolean
  setFormDirty: (dirty: boolean) => void

  // Toast/notification state
  toast: {
    message: string
    type: 'success' | 'error' | 'info'
    visible: boolean
  }
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  hideToast: () => void
}

const DEFAULT_TREE_POSITION = { x: 0, y: 0 }
const DEFAULT_ZOOM = 1

/**
 * Factory function để tạo UI store
 * 
 * ⚠️ QUAN TRỌNG: Dùng factory pattern thay vì global store
 * để tránh SSR issues trong Next.js App Router
 */
export const createUIStore = () => {
  return createStore<UIStore>((set) => ({
    // Sidebar
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    // Person modal
    selectedPersonId: null,
    openPersonModal: (id) => set({ selectedPersonId: id }),
    closePersonModal: () => set({ selectedPersonId: null }),

    // Tree view
    treeZoom: DEFAULT_ZOOM,
    setTreeZoom: (zoom) => set({ treeZoom: Math.max(0.1, Math.min(3, zoom)) }),
    treePosition: DEFAULT_TREE_POSITION,
    setTreePosition: (pos) => set({ treePosition: pos }),
    resetTreeView: () =>
      set({
        treeZoom: DEFAULT_ZOOM,
        treePosition: DEFAULT_TREE_POSITION,
      }),

    // Form
    isFormDirty: false,
    setFormDirty: (dirty) => set({ isFormDirty: dirty }),

    // Toast
    toast: {
      message: '',
      type: 'info',
      visible: false,
    },
    showToast: (message, type) =>
      set({
        toast: {
          message,
          type,
          visible: true,
        },
      }),
    hideToast: () =>
      set((state) => ({
        toast: {
          ...state.toast,
          visible: false,
        },
      })),
  }))
}
