import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID!

export const twilioClient = twilio(accountSid, authToken)

/**
 * Generate a Twilio Access Token with a Voice Grant.
 * The identity is the Supabase user ID so calls are tracked per user.
 */
export function generateVoiceToken(identity: string): string {
  const AccessToken = twilio.jwt.AccessToken
  const VoiceGrant = AccessToken.VoiceGrant

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  })

  const token = new AccessToken(accountSid, authToken, {
    identity,
    ttl: 3600, // 1 hour
  })
  token.addGrant(voiceGrant)

  return token.toJwt()
}

/**
 * TwiML response for outbound calls — routes to a phone number.
 * This is served from a TwiML app endpoint (configure in Twilio console).
 */
export function buildOutboundTwiml(to: string): string {
  const VoiceResponse = twilio.twiml.VoiceResponse
  const response = new VoiceResponse()
  const dial = response.dial({ callerId: process.env.TWILIO_PHONE_NUMBER! })
  dial.number(to)
  return response.toString()
}
