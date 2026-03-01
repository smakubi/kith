import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface ReminderEmailPayload {
  /** Recipient email address */
  to: string
  /** Recipient's first name or display name */
  userName: string
  /** Names of overdue contacts to reconnect with */
  contactNames: string[]
}

export async function sendReminderEmail({ to, userName, contactNames }: ReminderEmailPayload) {
  const count = contactNames.length
  const contactList = contactNames
    .map((name) => `<li style="padding: 4px 0;"><strong>${name}</strong></li>`)
    .join('')

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f43f5e; padding: 28px 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">
          💛 Time to reconnect, ${userName}
        </h1>
      </div>
      <div style="background: #ffffff; padding: 28px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
        <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">
          You have <strong style="color: #0f172a;">${count} contact${count !== 1 ? 's' : ''}</strong>
          ${count !== 1 ? 'that are' : 'that is'} due for a check-in:
        </p>
        <ul style="color: #334155; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
          ${contactList}
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://kith.app'}/people"
           style="display: inline-block; background: #f43f5e; color: white; padding: 12px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Open Kith →
        </a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 28px; margin-bottom: 0;">
          To change how often you get reminded about a contact, open their profile and adjust
          the Reminder settings. To turn off all reminders, disable them per-person.
        </p>
      </div>
    </div>
  `

  return resend.emails.send({
    from: 'Kith <reminders@kith.app>',
    to,
    subject: `${count} check-in${count !== 1 ? 's' : ''} waiting — Kith`,
    html,
  })
}
