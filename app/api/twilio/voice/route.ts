import { NextRequest, NextResponse } from 'next/server'
import { buildOutboundTwiml } from '@/lib/twilio'

/**
 * TwiML webhook for outbound calls from the browser SDK.
 * Twilio calls this endpoint when a browser-initiated call begins.
 */
export async function POST(req: NextRequest) {
  const body = await req.formData()
  const to = body.get('To')?.toString() ?? ''

  const twiml = buildOutboundTwiml(to)

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  })
}
