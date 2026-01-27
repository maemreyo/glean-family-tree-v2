// app/dashboard/page.tsx
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

/**
 * Dashboard Server Component
 * 
 * ✅ Pattern:
 * 1. Fetch data ở server (fast initial load)
 * 2. Check authentication
 * 3. Pass initialData xuống Client Component
 */
export default async function DashboardPage() {
  const supabase = await createServerSupabase()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Prefetch data for React Query cache
  const { data: persons } = await supabase
    .from('persons')
    .select('*, person_photos(url, is_profile_picture)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <DashboardClient
        userId={user.id}
        userEmail={user.email || ''}
        initialPersons={persons || []}
      />
    </div>
  )
}
