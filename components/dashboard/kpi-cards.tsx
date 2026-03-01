import { Card, CardContent } from '@/components/ui/card'
import { Users, MessageCircle, Cake, AlertCircle } from 'lucide-react'
import type { DashboardStats } from '@/types'

interface KpiCardsProps {
  stats: DashboardStats
}

const cards = (stats: DashboardStats) => [
  {
    label: 'People in Network',
    value: stats.totalPeople,
    icon: Users,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
  {
    label: 'Reached Out This Month',
    value: stats.reachedOutThisMonth,
    icon: MessageCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Upcoming Birthdays',
    value: stats.upcomingBirthdays,
    icon: Cake,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    label: 'Overdue Check-ins',
    value: stats.overdueCheckIns,
    icon: AlertCircle,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
]

export function KpiCards({ stats }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards(stats).map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.8} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
