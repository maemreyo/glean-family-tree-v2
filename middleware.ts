import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware để maintain Supabase session
 * 
 * 🎯 Mục đích:
 * - Refresh auth token nếu sắp hết hạn
 * - Đảm bảo cookie được set đúng cách
 * - Validate session trước khi request đến page
 * 
 * ⚠️ QUAN TRỌNG:
 * - LUÔN gọi supabase.auth.getUser() để refresh session
 * - Phải return supabaseResponse (không phải NextResponse.next())
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies trong request (cho Server Components)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Tạo response mới với updated cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Set cookies trong response (gửi về browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // QUAN TRỌNG: Gọi getUser() để refresh session
  // Không cần xử lý kết quả ở đây - chỉ cần refresh
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Optional: Redirect logic can be added here
  
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match tất cả request paths NGOẠI TRỪ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (*.svg, *.png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
