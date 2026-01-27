// lib/supabase/client.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Tạo Supabase client cho Client Components
 * 
 * ✅ Sử dụng cho:
 * - Client Components ('use client')
 * - Realtime subscriptions
 * - Client-side mutations
 * - useEffect, useState hooks
 * 
 * ❌ KHÔNG sử dụng cho:
 * - Server Components
 * - Route Handlers
 * - Middleware
 * 
 * 💡 Tip: Dùng singleton pattern để tránh tạo nhiều instance
 */
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClientSupabase() {
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseClient
}
