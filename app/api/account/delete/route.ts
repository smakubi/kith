import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Use service-role client to delete the auth user (cascades to all user data via RLS)
    const admin = createServiceClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[account/delete] error:', err)
    return NextResponse.json(
      { error: 'Failed to delete account', detail: err.message },
      { status: 500 }
    )
  }
}
