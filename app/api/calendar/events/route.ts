import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

/**
 * POST /api/calendar/events
 * Creates a Google Calendar event on behalf of the authenticated user.
 *
 * Body (JSON):
 *   title:       string  — event summary
 *   startTime:   string  — ISO 8601 datetime
 *   durationMin: number  — duration in minutes (default 60)
 *   withMeet:    boolean — whether to add a Google Meet conference link
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Retrieve stored Google OAuth tokens from Supabase
  const { data: session } = await supabase.auth.getSession()
  const providerToken = session?.session?.provider_token
  const providerRefreshToken = session?.session?.provider_refresh_token

  if (!providerToken) {
    return NextResponse.json(
      { error: 'Google account not connected. Please sign in with Google.' },
      { status: 403 }
    )
  }

  const { title, startTime, durationMin = 60, withMeet = false } = await req.json()

  if (!title || !startTime) {
    return NextResponse.json({ error: 'title and startTime are required' }, { status: 400 })
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    auth.setCredentials({
      access_token: providerToken,
      refresh_token: providerRefreshToken ?? undefined,
    })

    const calendar = google.calendar({ version: 'v3', auth })

    const start = new Date(startTime)
    const end = new Date(start.getTime() + durationMin * 60 * 1000)

    const eventBody: any = {
      summary: title,
      start: { dateTime: start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: end.toISOString(), timeZone: 'UTC' },
    }

    if (withMeet) {
      eventBody.conferenceData = {
        createRequest: {
          requestId: `kith-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      }
    }

    const { data: event } = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: withMeet ? 1 : 0,
      requestBody: eventBody,
    })

    return NextResponse.json({
      eventId: event.id,
      eventUrl: event.htmlLink,
      meetUrl: event.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri ?? null,
    })
  } catch (err: any) {
    console.error('[calendar/events] error:', err)
    return NextResponse.json(
      { error: 'Failed to create calendar event', detail: err.message },
      { status: 500 }
    )
  }
}
