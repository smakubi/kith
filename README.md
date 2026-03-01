# Kith — Personal Relationship Manager

Kith is a full-stack web app that helps you nurture the relationships that matter most. It tracks your contacts, logs every interaction, reminds you when you're overdue for a catch-up, and lets you call or schedule meetings right from a person's profile.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth & DB | Supabase (Postgres + Row Level Security) |
| Calling | Twilio Voice SDK (WebRTC browser calls) |
| Calendar | Google Calendar API v3 |
| Email | Resend |
| Drag & Drop | dnd-kit |
| Charts | Recharts |
| Deployment | Vercel (with Cron) |

---

## Features

- **Auth** — Email/password and Google OAuth; onboarding flow to set your name and first contacts
- **Dashboard** — KPI cards (network size, reach-outs this month, upcoming birthdays, overdue check-ins); interaction activity chart; per-circle breakdown chart; top overdue and birthday lists
- **People** — Searchable, filterable table of all contacts; slide-over form to add/edit; quick-action buttons for logging calls and messages
- **Circles** — Kanban board with four depth tiers (Inner Circle, Close Friends, Social Circle, Reconnect); drag-and-drop to move contacts between circles
- **Person Profile** — Full profile with contact info, tags, notes; activity feed (calls, messages, meetups, notes); browser-based calling via Twilio; Google Calendar scheduling with Meet link; per-contact reminder interval
- **Reminders** — Per-contact configurable interval (7–180 days); daily Vercel Cron sends a Resend digest email for all overdue contacts; in-app notification bell
- **Phone integration** — Twilio Voice SDK; browser WebRTC calling with mute/hang-up controls; duration timer; post-call note dialog
- **Calendar integration** — Google Calendar API; creates events with optional Google Meet link; logs a `meetup` interaction with the event URL

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Twilio](https://www.twilio.com) account with a Voice-capable phone number and a TwiML App
- A [Google Cloud](https://console.cloud.google.com) project with the Calendar API enabled and OAuth 2.0 credentials
- A [Resend](https://resend.com) account with a verified sending domain

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/kith.git
cd kith
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in every value:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (secret) |
| `TWILIO_ACCOUNT_SID` | Twilio console → Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio console → Account Info |
| `TWILIO_TWIML_APP_SID` | Twilio console → Voice → TwiML Apps |
| `TWILIO_PHONE_NUMBER` | Twilio console → Phone Numbers |
| `GOOGLE_CLIENT_ID` | Google Cloud → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud → APIs & Services → Credentials |
| `RESEND_API_KEY` | Resend dashboard → API Keys |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally |
| `CRON_SECRET` | Any random string — used to secure the cron endpoint |

### 3. Set up Supabase

#### Run the migration

In the Supabase dashboard go to **SQL Editor** and paste the contents of `supabase/migrations/001_initial.sql`, then run it. This creates all four tables (`users`, `people`, `interactions`, `reminders`), Row Level Security policies, and the triggers.

#### Enable Google OAuth (optional but recommended)

In the Supabase dashboard go to **Authentication → Providers → Google** and add your Google Client ID and Secret. Set the redirect URL to:

```
https://<your-project>.supabase.co/auth/v1/callback
```

Also add your authorized redirect URI in Google Cloud:

```
https://<your-project>.supabase.co/auth/v1/callback
```

To get Google Calendar access, request these additional OAuth scopes in Supabase:

```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```

In Supabase → Authentication → Providers → Google, add those scopes to **Additional OAuth Scopes**.

### 4. Configure Twilio Voice

1. Create a TwiML App in the Twilio console with the Voice request URL pointing to:
   ```
   https://your-domain.com/api/twilio/voice
   ```
2. Copy the TwiML App SID into `TWILIO_TWIML_APP_SID`.
3. Make sure your Twilio phone number is configured to use this TwiML App for voice calls.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
kith/
├── app/
│   ├── (auth)/              # Login, signup pages
│   ├── (dashboard)/         # Protected app pages
│   │   ├── page.tsx         # Dashboard
│   │   ├── people/
│   │   │   ├── page.tsx     # People list
│   │   │   └── [id]/page.tsx # Person profile
│   │   └── circles/page.tsx # Circles kanban
│   ├── (onboarding)/        # Onboarding flow
│   ├── api/
│   │   ├── twilio/
│   │   │   ├── token/route.ts  # Generates Twilio capability tokens
│   │   │   └── voice/route.ts  # TwiML webhook for outbound calls
│   │   ├── calendar/
│   │   │   └── events/route.ts # Creates Google Calendar events
│   │   └── cron/
│   │       └── reminders/route.ts # Daily reminder digest (Vercel Cron)
│   └── auth/callback/route.ts   # Supabase OAuth callback
├── components/
│   ├── circles/             # Circles board, columns, draggable cards
│   ├── dashboard/           # KPI cards, charts, lists
│   ├── layout/              # Sidebar, notification bell
│   ├── people/              # People table, person form
│   ├── profile/             # Activity feed, call UI, schedule modal, reminder settings
│   └── ui/                  # shadcn/ui primitives
├── hooks/
│   └── use-toast.ts
├── lib/
│   ├── resend.ts            # Resend email helper
│   ├── twilio.ts            # Twilio token generator + TwiML builder
│   ├── utils.ts             # cn(), date formatters, initials, etc.
│   └── supabase/
│       ├── client.ts        # Browser Supabase client
│       └── server.ts        # Server Supabase client (+ service role)
├── supabase/
│   └── migrations/
│       └── 001_initial.sql  # Full schema, RLS, triggers, views
├── types/
│   └── index.ts             # All TypeScript types and constants
├── middleware.ts             # Route protection
├── vercel.json               # Cron job definition
└── .env.example
```

---

## Deployment to Vercel

### 1. Push to GitHub and import into Vercel

Connect your GitHub repo to Vercel. Vercel will auto-detect the Next.js framework.

### 2. Add environment variables

In your Vercel project → Settings → Environment Variables, add every variable from `.env.example` with production values. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://kith.yourdomain.com`).

### 3. Deploy

```bash
git push origin main
```

Vercel builds and deploys automatically. The Cron job defined in `vercel.json` will run daily at 09:00 UTC:

```json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 9 * * *" }]
}
```

> **Note:** Vercel Cron is available on Pro and Enterprise plans. On Hobby, you can trigger the endpoint manually or use an external cron service.

### 4. Update Twilio Voice webhook URL

After deploying, update your TwiML App's Voice Request URL to:

```
https://your-production-domain.com/api/twilio/voice
```

### 5. Update Supabase redirect URLs

In Supabase → Authentication → URL Configuration, add:

```
https://your-production-domain.com/auth/callback
```

---

## Database Schema Overview

```sql
users        — user profile (name, avatar_url, email, onboarded)
people       — contacts (name, relation, circle, email, phone, location, birthday, tags, notes, last_contacted_at)
interactions — log entries (type: call/message/meetup/note/birthday, note, duration, event_url, occurred_at)
reminders    — per-contact check-in schedule (interval_days, next_due_at, enabled)
```

All tables have Row Level Security — users can only access their own rows.

Two Postgres triggers fire automatically:
- `handle_new_user` — creates a `users` row on every new `auth.users` entry
- `update_last_contacted` — updates `people.last_contacted_at` whenever a new `interactions` row is inserted

---

## Contributing

1. Fork the repo and create a feature branch
2. Run `npm run dev` locally
3. Test your changes against a fresh Supabase project
4. Open a pull request

---

## License

MIT
