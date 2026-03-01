import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Cake } from 'lucide-react'
import { initials, daysUntilBirthday, formatBirthday } from '@/lib/utils'
import type { Person } from '@/types'

interface BirthdaysListProps {
  people: Person[]
}

export function BirthdaysList({ people }: BirthdaysListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Cake className="w-4 h-4 text-amber-500" strokeWidth={1.8} />
          Upcoming Birthdays
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {people.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No birthdays in the next 30 days.</p>
        ) : (
          people.slice(0, 5).map((person) => {
            const days = daysUntilBirthday(person.birthday)
            return (
              <Link key={person.id} href={`/people/${person.id}`}>
                <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={person.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{initials(person.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{person.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatBirthday(person.birthday)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {days === 0 ? (
                      <span className="text-xs font-semibold text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                        Today! 🎂
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        in {days}d
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
