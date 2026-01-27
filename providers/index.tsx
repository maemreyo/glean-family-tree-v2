// providers/index.tsx
'use client'

import { type ReactNode } from 'react'
import { ReactQueryProvider } from './react-query-provider'
import { UIStoreProvider } from './ui-store-provider'

/**
 * Combined Providers - Wrap toàn bộ app
 * 
 * Order matters:
 * 1. React Query Provider (cần cho Supabase queries)
 * 2. UI Store Provider (có thể depend on queries)
 * 
 * Usage:
 * ```tsx
 * // app/layout.tsx
 * <Providers>{children}</Providers>
 * ```
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <UIStoreProvider>{children}</UIStoreProvider>
    </ReactQueryProvider>
  )
}
