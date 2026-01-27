// providers/react-query-provider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

/**
 * React Query Provider với optimized config cho Next.js App Router
 * 
 * ⚠️ Config này đã được tune cho performance và UX tốt nhất
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data được consider "fresh" trong 60 giây
            staleTime: 60 * 1000,

            // Cache data trong 5 phút
            gcTime: 5 * 60 * 1000,

            // KHÔNG auto refetch khi window focus
            // (vì Supabase realtime đã handle updates)
            refetchOnWindowFocus: false,

            // Retry failed requests 1 lần
            retry: 1,

            // Không refetch on mount nếu data còn fresh
            refetchOnMount: false,

            // Error handling
            throwOnError: false,
          },
          mutations: {
            // Retry mutations 0 lần (user phải trigger lại manual)
            retry: 0,

            // Error handling
            throwOnError: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools chỉ show trong development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Alternative: Config cho app cần data realtime CỰC KỲ cập nhật
 */
export function ReactQueryProviderRealtime({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stale ngay lập tức
            staleTime: 0,

            // Cache data trong 30 giây only
            gcTime: 30 * 1000,

            // Refetch on window focus
            refetchOnWindowFocus: true,

            // Refetch mỗi 30 giây
            refetchInterval: 30 * 1000,

            retry: 2,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}
