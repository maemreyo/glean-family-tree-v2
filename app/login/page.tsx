// app/login/page.tsx
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/login-form'

/**
 * Example: Login Page
 * 
 * Pattern: Server Component + Client Form Component
 * - Server Component: Check auth status
 * - Client Component: Handle form interactions
 */
export default async function LoginPage() {
  const supabase = await createServerSupabase()

  // Redirect nếu đã login
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Sign in</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or create a new account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
