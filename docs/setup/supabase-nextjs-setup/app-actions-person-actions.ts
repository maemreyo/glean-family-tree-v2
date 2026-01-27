// app/actions/person-actions.ts
'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Example: Server Actions với Supabase
 * 
 * ✅ Best Practices:
 * - Dùng 'use server' directive
 * - Validate authentication trong mỗi action
 * - Revalidate cache sau mutations
 * - Return serializable data (no functions, class instances, etc.)
 * - Handle errors với try-catch
 */

interface ActionResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Thêm person mới
 */
export async function createPerson(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabase()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const name = formData.get('name') as string
    const dateOfBirth = formData.get('date_of_birth') as string
    const gender = formData.get('gender') as string

    if (!name) {
      return { success: false, error: 'Name is required' }
    }

    const { data, error } = await supabase
      .from('persons')
      .insert({
        name,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate dashboard page để show data mới
    revalidatePath('/dashboard')

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update person
 */
export async function updatePerson(
  personId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabase()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const name = formData.get('name') as string
    const dateOfBirth = formData.get('date_of_birth') as string
    const gender = formData.get('gender') as string

    const { data, error } = await supabase
      .from('persons')
      .update({
        name,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
      })
      .eq('id', personId)
      .eq('user_id', user.id) // RLS: chỉ update own data
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete person
 */
export async function deletePerson(personId: string): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabase()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('persons')
      .delete()
      .eq('id', personId)
      .eq('user_id', user.id) // RLS: chỉ delete own data

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Logout action
 */
export async function logout() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect('/login')
}
