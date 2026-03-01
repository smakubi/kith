import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user && data.session) {
      // Persist Google OAuth tokens in user metadata so they survive JWT refreshes
      if (data.session.provider_token) {
        await supabase.auth.updateUser({
          data: {
            google_access_token: data.session.provider_token,
            google_refresh_token: data.session.provider_refresh_token ?? null,
          },
        })
      }
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('users')
        .select('onboarded')
        .eq('id', data.user.id)
        .single()

      if (!profile?.onboarded) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
