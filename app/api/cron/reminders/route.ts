import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendReminderEmail } from '@/lib/resend'

/**
 * GET /api/cron/reminders
 * Called daily at 09:00 UTC by Vercel Cron (vercel.json).
 *
 * Logic:
 *  1. Find all enabled reminders where next_due_at <= now
 *  2. Group by user_id
 *  3. For each user, fetch their email and the overdue person names
 *  4. Send a single digest email via Resend
 *  5. Advance next_due_at for each processed reminder
 */
export async function GET(req: NextRequest) {
  // Validate the Vercel cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  try {
    // Fetch all due reminders (with person name and user email via joins)
    const { data: dueReminders, error: remErr } = await supabase
      .from('reminders')
      .select(`
        id,
        user_id,
        person_id,
        interval_days,
        people ( name ),
        users ( email, name )
      `)
      .eq('enabled', true)
      .lte('next_due_at', now.toISOString())

    if (remErr) throw remErr
    if (!dueReminders || dueReminders.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No due reminders' })
    }

    // Group by user_id
    const byUser = dueReminders.reduce<Record<string, typeof dueReminders>>((acc, r) => {
      if (!acc[r.user_id]) acc[r.user_id] = []
      acc[r.user_id].push(r)
      return acc
    }, {})

    let emailsSent = 0

    for (const [userId, reminders] of Object.entries(byUser)) {
      const firstReminder = reminders[0] as any
      const userEmail = firstReminder.users?.email as string | null
      const userName = firstReminder.users?.name as string | null

      if (!userEmail) continue

      // Check user's notification preference (stored in auth user metadata)
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
      if (authUser?.user_metadata?.notifications_enabled === false) continue

      const contactNames = reminders.map((r: any) => r.people?.name ?? 'Unknown').filter(Boolean)

      try {
        await sendReminderEmail({
          to: userEmail,
          userName: userName ?? 'there',
          contactNames,
        })
        emailsSent++
      } catch (emailErr) {
        console.error(`[cron/reminders] failed to email ${userEmail}:`, emailErr)
      }
    }

    // Advance next_due_at for all processed reminders
    const updates = dueReminders.map((r: any) => {
      const nextDue = new Date(now)
      nextDue.setDate(nextDue.getDate() + r.interval_days)
      return supabase
        .from('reminders')
        .update({ next_due_at: nextDue.toISOString() })
        .eq('id', r.id)
    })
    await Promise.all(updates)

    return NextResponse.json({
      processed: dueReminders.length,
      emailsSent,
      timestamp: now.toISOString(),
    })
  } catch (err: any) {
    console.error('[cron/reminders] fatal error:', err)
    return NextResponse.json(
      { error: 'Cron job failed', detail: err.message },
      { status: 500 }
    )
  }
}
