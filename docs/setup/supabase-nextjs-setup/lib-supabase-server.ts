// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Tạo Supabase client cho Server Components và Route Handlers
 * 
 * ✅ Sử dụng cho:
 * - Server Components (app/page.tsx)
 * - Server Actions
 * - Route Handlers (app/api/*/route.ts)
 * 
 * ❌ KHÔNG sử dụng cho:
 * - Client Components ('use client')
 * - Middleware (dùng hàm riêng)
 */
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Server Component không thể set cookie trong render phase
            // Điều này bình thường và có thể bỏ qua
          }
        },
      },
    }
  )
}
