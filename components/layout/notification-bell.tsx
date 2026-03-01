'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Bell, Cake, AlertCircle } from 'lucide-react'
import { daysUntilBirthday, formatBirthday } from '@/lib/utils'
import type { Person } from '@/types'
import { differenceInDays, parseISO } from 'date-fns'

interface Notification {
  id: string
  type: 'birthday' | 'overdue'
  person: Person
  message: string
}

export function NotificationBell() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: people } = await supabase
        .from('people')
        .select('*')
        .eq('user_id', user.id)

      if (!people) return

      const notifs: Notification[] = []

      people.forEach((person: Person) => {
        // Upcoming birthdays (next 7 days)
        const days = daysUntilBirthday(person.birthday)
        if (days !== null && days <= 7 && days >= 0) {
          notifs.push({
            id: `bday-${person.id}`,
            type: 'birthday',
            person,
            message: days === 0
              ? `🎂 ${person.name}'s birthday is today!`
              : `🎂 ${person.name}'s birthday in ${days} day${days === 1 ? '' : 's'}`,
          })
        }

        // Overdue check-ins (30+ days)
        if (person.last_contacted_at) {
          const daysSince = differenceInDays(new Date(), parseISO(person.last_contacted_at))
          if (daysSince >= 30) {
            notifs.push({
              id: `overdue-${person.id}`,
              type: 'overdue',
              person,
              message: `${person.name} — ${daysSince} days since last contact`,
            })
          }
        } else {
          notifs.push({
            id: `overdue-${person.id}`,
            type: 'overdue',
            person,
            message: `${person.name} — never contacted`,
          })
        }
      })

      // Sort: birthdays first, then overdue
      notifs.sort((a, b) => (a.type === 'birthday' ? -1 : b.type === 'birthday' ? 1 : 0))
      setNotifications(notifs.slice(0, 10))
    }

    loadNotifications()
  }, [])

  const count = notifications.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[15px] w-[15px]" strokeWidth={1.8} />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {count > 0 && (
            <span className="text-xs font-normal text-muted-foreground">{count} unread</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            All caught up! 🎉
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} asChild>
              <Link href={`/people/${n.person.id}`} className="flex items-start gap-3 p-3 cursor-pointer">
                <div className={`mt-0.5 p-1.5 rounded-lg ${n.type === 'birthday' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                  {n.type === 'birthday' ? (
                    <Cake className="h-3.5 w-3.5 text-amber-600" strokeWidth={1.8} />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" strokeWidth={1.8} />
                  )}
                </div>
                <p className="text-sm leading-snug text-slate-700 dark:text-slate-300">{n.message}</p>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
