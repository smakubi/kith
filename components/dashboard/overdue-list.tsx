import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { initials, lastContactedLabel } from '@/lib/utils'
import type { Person, Relation } from '@/types'

interface OverdueListProps {
  people: Person[]
}

const relationVariant: Record<Relation, 'friend' | 'family' | 'mentor' | 'colleague'> = {
  Friend: 'friend',
  Family: 'family',
  Mentor: 'mentor',
  Colleague: 'colleague',
}

export function OverdueList({ people }: OverdueListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" strokeWidth={1.8} />
            Overdue Check-ins
          </CardTitle>
          {people.length > 0 && (
            <Link href="/people">
              <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {people.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            You&apos;re all caught up! 🎉
          </p>
        ) : (
          people.slice(0, 5).map((person) => (
            <Link key={person.id} href={`/people/${person.id}`}>
              <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={person.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{initials(person.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{person.name}</p>
                  <p className="text-xs text-red-500 font-medium">
                    {lastContactedLabel(person.last_contacted_at)}
                  </p>
                </div>
                {person.relation && (
                  <Badge variant={relationVariant[person.relation]} className="shrink-0">
                    {person.relation}
                  </Badge>
                )}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
