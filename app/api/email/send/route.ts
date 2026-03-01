import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDirectEmail } from '@/lib/resend'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { to, subject, body } = await request.json()

  if (!to || !subject || !body) {
    return NextResponse.json({ error: 'Missing to, subject, or body' }, { status: 400 })
  }

  // Get sender's display name from user profile
  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const fromName = profile?.name ?? user.email ?? 'Someone'
  const replyTo = user.email!

  try {
    await sendDirectEmail({ to, fromName, replyTo, subject, body })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[email/send] error:', err)
    return NextResponse.json(
      { error: 'Failed to send email', detail: err.message },
      { status: 500 }
    )
  }
}
