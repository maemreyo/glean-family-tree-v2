// app/api/persons/route.ts
import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Example: Route Handler với Authentication
 * 
 * ✅ Best Practices:
 * - Dùng createServerSupabase() cho Route Handlers
 * - Validate user trước khi xử lý request
 * - Return proper HTTP status codes
 * - Handle errors gracefully
 */

// GET /api/persons
export async function GET(request: Request) {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST /api/persons
export async function POST(request: Request) {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, date_of_birth, gender } = body

    // Validate input
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Insert với automatic user_id
    const { data, error } = await supabase
      .from('persons')
      .insert({
        name,
        date_of_birth,
        gender,
        user_id: user.id, // Gán user_id từ authenticated user
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

// PATCH /api/persons/[id]
export async function PATCH(request: Request) {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Update với RLS protection
    const { data, error } = await supabase
      .from('persons')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // Đảm bảo chỉ update own data
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

// DELETE /api/persons/[id]
export async function DELETE(request: Request) {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('persons')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Đảm bảo chỉ delete own data

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
