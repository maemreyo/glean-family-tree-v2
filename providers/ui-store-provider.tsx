// providers/ui-store-provider.tsx
'use client'

import { type ReactNode, createContext, useRef, useContext } from 'react'
import { useStore } from 'zustand'
import { type UIStore, createUIStore } from '@/stores/ui-store'

/**
 * Context để share store instance across components
 */
const UIStoreContext = createContext<ReturnType<typeof createUIStore> | null>(
  null
)

/**
 * Provider component - wrap app để provide store
 * 
 * ⚠️ Phải dùng pattern này trong Next.js App Router
 * để tránh store được share across server requests
 * 
 * Usage:
 * ```tsx
 * // app/layout.tsx
 * <UIStoreProvider>
 *   {children}
 * </UIStoreProvider>
 * ```
 */
export function UIStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ReturnType<typeof createUIStore> | undefined>(undefined)

  // Chỉ tạo store 1 lần
  if (!storeRef.current) {
    storeRef.current = createUIStore()
  }

  return (
    <UIStoreContext.Provider value={storeRef.current}>
      {children}
    </UIStoreContext.Provider>
  )
}

/**
 * Hook để access UI store với selector
 * 
 * Usage:
 * ```tsx
 * const sidebarOpen = useUIStore((state) => state.sidebarOpen)
 * const toggleSidebar = useUIStore((state) => state.toggleSidebar)
 * ```
 * 
 * ⚠️ Dùng selector để avoid unnecessary re-renders
 */
export function useUIStore<T>(selector: (store: UIStore) => T): T {
  const store = useContext(UIStoreContext)

  if (!store) {
    throw new Error('useUIStore must be used within UIStoreProvider')
  }

  return useStore(store, selector)
}

/**
 * Hook để get entire store (chỉ dùng khi cần nhiều fields)
 * 
 * ⚠️ Ưu tiên dùng useUIStore với selector
 */
export function useUIStoreAll(): UIStore {
  const store = useContext(UIStoreContext)

  if (!store) {
    throw new Error('useUIStoreAll must be used within UIStoreProvider')
  }

  return useStore(store)
}
