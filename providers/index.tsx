// providers/index.tsx
'use client'

import { type ReactNode } from 'react'
import { ReactQueryProvider } from './react-query-provider'
import { UIStoreProvider } from './ui-store-provider'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

/**
 * Combined Providers - Wrap toàn bộ app
 * 
 * Order matters:
 * 1. NuqsAdapter (URL state)
 * 2. React Query Provider (cần cho Supabase queries)
 * 3. UI Store Provider (có thể depend on queries)
 * 
 * Usage:
 * ```tsx
 * // app/layout.tsx
 * <Providers>{children}</Providers>
 * ```
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <ReactQueryProvider>
        <UIStoreProvider>{children}</UIStoreProvider>
      </ReactQueryProvider>
    </NuqsAdapter>
  )
}
