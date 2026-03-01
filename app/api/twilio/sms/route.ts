import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { twilioClient } from '@/lib/twilio'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { to, body } = await request.json()

  if (!to || !body) {
    return NextResponse.json({ error: 'Missing to or body' }, { status: 400 })
  }

  try {
    const message = await twilioClient.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body,
    })

    return NextResponse.json({ sid: message.sid })
  } catch (err: any) {
    console.error('[twilio/sms] error:', err)
    return NextResponse.json(
      { error: 'Failed to send message', detail: err.message },
      { status: 500 }
    )
  }
}
