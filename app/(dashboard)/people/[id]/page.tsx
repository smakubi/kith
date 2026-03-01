'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ActivityFeed } from '@/components/profile/activity-feed'
import { CallUi } from '@/components/profile/call-ui'
import { MessageUi } from '@/components/profile/message-ui'
import { EmailUi } from '@/components/profile/email-ui'
import { ScheduleModal } from '@/components/profile/schedule-modal'
import { ReminderSettings } from '@/components/profile/reminder-settings'
import { PersonForm } from '@/components/people/person-form'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft, MapPin, Calendar, Mail, Phone, Link2, Pencil,
  Users, CalendarPlus, Tag,
} from 'lucide-react'
import {
  initials, formatDate, formatBirthday, lastContactedColor, lastContactedLabel,
} from '@/lib/utils'
import type { Person, Interaction, Reminder } from '@/types'
import { RELATION_COLORS, CIRCLE_COLORS } from '@/types'

export default function PersonProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [person, setPerson] = useState<Person | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [reminder, setReminder] = useState<Reminder | null>(null)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const [{ data: p }, { data: ints }, { data: rem }] = await Promise.all([
        supabase.from('people').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('interactions').select('*').eq('person_id', id).order('occurred_at', { ascending: false }),
        supabase.from('reminders').select('*').eq('person_id', id).eq('user_id', user.id).single(),
      ])

      if (!p) { router.push('/people'); return }
      setPerson(p)
      setInteractions(ints ?? [])
      setReminder(rem)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (!person) return null

  const relationStyle = person.relation ? RELATION_COLORS[person.relation] : null
  const circleStyle = person.circle ? CIRCLE_COLORS[person.circle] : null

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/people" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} /> Back to People
      </Link>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20">
              <AvatarImage src={person.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">{initials(person.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{person.name}</h1>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {person.relation && relationStyle && (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${relationStyle.bg} ${relationStyle.text}`}>
                        {person.relation}
                      </span>
                    )}
                    {person.circle && circleStyle && (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${circleStyle.bg} ${circleStyle.text}`}>
                        {person.circle}
                      </span>
                    )}
                    {person.location && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" strokeWidth={1.8} /> {person.location}
                      </span>
                    )}
                    {person.birthday && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" strokeWidth={1.8} /> {formatBirthday(person.birthday)}
                      </span>
                    )}
                  </div>
                  {person.how_met && (
                    <p className="text-sm text-slate-500 mt-2">
                      <span className="font-medium text-slate-700">How you met:</span> {person.how_met}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="gap-1.5 shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} /> Edit
                </Button>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <CallUi person={person} userId={userId} />
                <MessageUi person={person} userId={userId} />
                <EmailUi person={person} userId={userId} />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setScheduleOpen(true)}
                >
                  <CalendarPlus className="h-3.5 w-3.5 text-violet-600" strokeWidth={1.8} /> Schedule
                </Button>
                <div className={`ml-auto flex items-center gap-1.5 text-xs font-medium ${lastContactedColor(person.last_contacted_at)}`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {lastContactedLabel(person.last_contacted_at)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="space-y-4">
          {/* Contact info */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contact Info</p>
              {person.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={1.8} />
                  <a href={`mailto:${person.email}`} className="text-slate-700 hover:text-rose-500 transition-colors truncate">
                    {person.email}
                  </a>
                </div>
              )}
              {person.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={1.8} />
                  <a href={`tel:${person.phone}`} className="text-slate-700 hover:text-rose-500 transition-colors">
                    {person.phone}
                  </a>
                </div>
              )}
              {person.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={1.8} />
                  <span className="text-slate-700">{person.location}</span>
                </div>
              )}
              {!person.email && !person.phone && !person.location && (
                <p className="text-sm text-slate-400">No contact info added.</p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {person.tags && person.tags.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="h-3 w-3" strokeWidth={1.8} /> Tags & Interests
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {person.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {person.notes && (
            <Card>
              <CardContent className="p-5 space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</p>
                <p className="text-sm text-slate-700 leading-relaxed">{person.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Reminder */}
          <Card>
            <CardContent className="p-5">
              <ReminderSettings personId={id} userId={userId} reminder={reminder} />
            </CardContent>
          </Card>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <ActivityFeed
                interactions={interactions}
                personId={id}
                userId={userId}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <PersonForm
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o)
          if (!o) {
            // Reload person data
            supabase
              .from('people').select('*').eq('id', id).single()
              .then(({ data }) => { if (data) setPerson(data) })
          }
        }}
        person={person}
      />

      {person && (
        <ScheduleModal
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          person={person}
          userId={userId}
        />
      )}
    </div>
  )
}
