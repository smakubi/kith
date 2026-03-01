// ──────────────────────────────────────
// Kith — Shared TypeScript Types
// ──────────────────────────────────────

export type Relation = 'Friend' | 'Family' | 'Mentor' | 'Colleague'
export type Circle = 'Inner Circle' | 'Close Friends' | 'Social Circle' | 'Reconnect'
export type InteractionType = 'call' | 'message' | 'meetup' | 'note' | 'birthday'

export interface User {
  id: string
  name: string | null
  avatar_url: string | null
  email: string
  onboarded: boolean
  created_at: string
}

export interface Person {
  id: string
  user_id: string
  name: string
  avatar_url: string | null
  relation: Relation | null
  circle: Circle | null
  email: string | null
  phone: string | null
  location: string | null
  birthday: string | null
  how_met: string | null
  notes: string | null
  tags: string[]
  last_contacted_at: string | null
  created_at: string
}

export interface Interaction {
  id: string
  user_id: string
  person_id: string
  type: InteractionType
  note: string | null
  duration_s: number | null
  event_url: string | null
  occurred_at: string
  created_at: string
}

export interface Reminder {
  id: string
  user_id: string
  person_id: string
  interval_days: number
  next_due_at: string
  enabled: boolean
}

// ── UI helpers ──────────────────────────────────────────────

export const RELATION_COLORS: Record<Relation, { bg: string; text: string }> = {
  Friend:    { bg: 'bg-sky-100',    text: 'text-sky-700'   },
  Family:    { bg: 'bg-violet-100', text: 'text-violet-700' },
  Mentor:    { bg: 'bg-amber-100',  text: 'text-amber-700' },
  Colleague: { bg: 'bg-teal-100',   text: 'text-teal-700'  },
}

export const CIRCLE_COLORS: Record<Circle, { bg: string; text: string }> = {
  'Inner Circle':   { bg: 'bg-rose-100',    text: 'text-rose-700'   },
  'Close Friends':  { bg: 'bg-orange-100',  text: 'text-orange-700' },
  'Social Circle':  { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  Reconnect:        { bg: 'bg-slate-100',   text: 'text-slate-600'  },
}

export const CIRCLE_ORDER: Circle[] = [
  'Inner Circle',
  'Close Friends',
  'Social Circle',
  'Reconnect',
]

export const INTERACTION_ICONS: Record<InteractionType, string> = {
  call:     'Phone',
  message:  'MessageCircle',
  meetup:   'Users',
  note:     'FileText',
  birthday: 'Cake',
}

// ── Dashboard KPI types ──────────────────────────────────────

export interface DashboardStats {
  totalPeople: number
  reachedOutThisMonth: number
  upcomingBirthdays: number
  overdueCheckIns: number
}

export interface InteractionChartPoint {
  month: string
  interactions: number
}

export interface CircleChartPoint {
  circle: string
  count: number
  fill: string
}

// ── Form schemas (Zod) ───────────────────────────────────────
// (defined in component files to keep things co-located)

export interface CalendarEventPayload {
  personId: string
  personName: string
  title: string
  startDateTime: string
  durationMinutes: number
  addMeetLink: boolean
}
