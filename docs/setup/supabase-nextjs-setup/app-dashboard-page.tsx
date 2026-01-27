// app/dashboard/page.tsx
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FamilyTreeClient } from '@/components/FamilyTreeClient'

/**
 * Example: Protected Server Component
 * 
 * ✅ Best Practices:
 * - Fetch data ở server để tận dụng RLS
 * - Pass initialData cho Client Component (tránh loading state)
 * - Redirect nếu chưa login
 */
export default async function DashboardPage() {
  const supabase = await createServerSupabase()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch data với Row Level Security (RLS)
  const { data: persons, error } = await supabase
    .from('persons')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching persons:', error)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome, {user.email}</p>
      </div>

      {/* Pass initialData để tránh loading state ban đầu */}
      <FamilyTreeClient initialData={persons || []} userId={user.id} />
    </div>
  )
}
