// app/layout.tsx
import { Providers } from '@/providers'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Supabase + Zustand + React Query',
  description: 'Full-stack boilerplate with perfect state management',
}

/**
 * Root Layout
 * 
 * ⚠️ QUAN TRỌNG:
 * - Wrap children trong <Providers> để enable:
 *   1. React Query
 *   2. Zustand Store
 * - Providers PHẢI là Client Component
 * - Layout này là Server Component
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
