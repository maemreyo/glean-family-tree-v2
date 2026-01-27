// app/auth/callback/route.ts
import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth Callback Handler
 * 
 * 🎯 Mục đích:
 * - Handle OAuth callbacks (Google, GitHub, etc.)
 * - Handle email verification links
 * - Handle magic link authentication
 * 
 * ⚠️ QUAN TRỌNG:
 * - Phải có route này để OAuth và magic links hoạt động
 * - URL này phải được config trong Supabase Dashboard:
 *   Authentication > URL Configuration > Redirect URLs
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createServerSupabase()
    
    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect đến dashboard sau khi authenticate
  return NextResponse.redirect(`${origin}/dashboard`)
}
