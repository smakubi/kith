import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { InteractionsChart } from '@/components/dashboard/interactions-chart'
import { CirclesChart } from '@/components/dashboard/circles-chart'
import { OverdueList } from '@/components/dashboard/overdue-list'
import { BirthdaysList } from '@/components/dashboard/birthdays-list'
import { differenceInDays, parseISO, format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import type { DashboardStats, InteractionChartPoint, CircleChartPoint, Person } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all people
  const { data: people = [] } = await supabase
    .from('people')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  // Fetch interactions for last 6 months
  const sixMonthsAgo = subMonths(new Date(), 6)
  const { data: interactions = [] } = await supabase
    .from('interactions')
    .select('occurred_at, type')
    .eq('user_id', user.id)
    .gte('occurred_at', sixMonthsAgo.toISOString())

  // ── KPI Stats ────────────────────────────────────
  const now = new Date()
  const startOfThisMonth = startOfMonth(now)

  const reachedOutThisMonth = new Set(
    interactions
      .filter((i) => parseISO(i.occurred_at) >= startOfThisMonth)
      .map((i) => {
        // We'd need person_id here — fetch separately if needed
        return i.occurred_at
      }),
  ).size

  // Better: count unique people reached out to this month
  const { data: monthInteractions = [] } = await supabase
    .from('interactions')
    .select('person_id')
    .eq('user_id', user.id)
    .gte('occurred_at', startOfThisMonth.toISOString())

  const uniqueReachedThisMonth = new Set(monthInteractions.map((i) => i.person_id)).size

  const upcomingBirthdays = (people as Person[]).filter((p) => {
    if (!p.birthday) return false
    const bday = parseISO(p.birthday)
    const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
    let diff = differenceInDays(thisYear, now)
    if (diff < 0) {
      const nextYear = new Date(now.getFullYear() + 1, bday.getMonth(), bday.getDate())
      diff = differenceInDays(nextYear, now)
    }
    return diff >= 0 && diff <= 30
  })

  const overdueContacts = (people as Person[]).filter((p) => {
    if (!p.last_contacted_at) return true
    return differenceInDays(now, parseISO(p.last_contacted_at)) >= 30
  })

  const stats: DashboardStats = {
    totalPeople: people.length,
    reachedOutThisMonth: uniqueReachedThisMonth,
    upcomingBirthdays: upcomingBirthdays.length,
    overdueCheckIns: overdueContacts.length,
  }

  // ── Interactions chart data (last 6 months) ──────
  const chartData: InteractionChartPoint[] = []
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const count = interactions.filter((interaction) => {
      const d = parseISO(interaction.occurred_at)
      return d >= monthStart && d <= monthEnd
    }).length
    chartData.push({ month: format(monthDate, 'MMM'), interactions: count })
  }

  // ── Circles chart data ────────────────────────────
  const circleCounts: Record<string, number> = {
    'Inner Circle': 0,
    'Close Friends': 0,
    'Social Circle': 0,
    Reconnect: 0,
  }
  ;(people as Person[]).forEach((p) => {
    if (p.circle && circleCounts[p.circle] !== undefined) {
      circleCounts[p.circle]++
    }
  })

  const circleColors: Record<string, string> = {
    'Inner Circle': '#f43f5e',
    'Close Friends': '#f97316',
    'Social Circle': '#6366f1',
    Reconnect: '#94a3b8',
  }

  const circleChartData: CircleChartPoint[] = Object.entries(circleCounts).map(
    ([circle, count]) => ({
      circle: circle.replace(' Circle', '').replace(' Friends', '\nFriends'),
      count,
      fill: circleColors[circle],
    }),
  )

  // ── Sort overdue by longest gap first ────────────
  const sortedOverdue = [...overdueContacts].sort((a, b) => {
    const daysA = a.last_contacted_at
      ? differenceInDays(now, parseISO(a.last_contacted_at))
      : 9999
    const daysB = b.last_contacted_at
      ? differenceInDays(now, parseISO(b.last_contacted_at))
      : 9999
    return daysB - daysA
  })

  // ── Sort birthdays by soonest ─────────────────────
  const sortedBirthdays = [...upcomingBirthdays].sort((a, b) => {
    const getNextBday = (person: Person) => {
      const bday = parseISO(person.birthday!)
      const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
      let diff = differenceInDays(thisYear, now)
      if (diff < 0) diff += 365
      return diff
    }
    return getNextBday(a) - getNextBday(b)
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Your relationship health at a glance.</p>
      </div>

      <KpiCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InteractionsChart data={chartData} />
        <CirclesChart data={circleChartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OverdueList people={sortedOverdue} />
        <BirthdaysList people={sortedBirthdays} />
      </div>
    </div>
  )
}
