import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateVoiceToken } from '@/lib/twilio'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Use the user's ID as their Twilio identity (stable, unique)
    const identity = `kith_${user.id.replace(/-/g, '_')}`
    const token = generateVoiceToken(identity)

    return NextResponse.json({ token, identity })
  } catch (err: any) {
    console.error('[twilio/token] error:', err)
    return NextResponse.json(
      { error: 'Failed to generate token', detail: err.message },
      { status: 500 }
    )
  }
}
