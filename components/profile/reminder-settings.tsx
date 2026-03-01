'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, BellOff } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { addDays } from 'date-fns'
import type { Reminder } from '@/types'

interface ReminderSettingsProps {
  personId: string
  userId: string
  reminder?: Reminder | null
}

const INTERVALS = [
  { label: 'Every week', days: 7 },
  { label: 'Every 2 weeks', days: 14 },
  { label: 'Every month', days: 30 },
  { label: 'Every 2 months', days: 60 },
  { label: 'Every quarter', days: 90 },
  { label: 'Every 6 months', days: 180 },
]

export function ReminderSettings({ personId, userId, reminder: initialReminder }: ReminderSettingsProps) {
  const supabase = createClient()
  const [reminder, setReminder] = useState<Reminder | null | undefined>(initialReminder)
  const [saving, setSaving] = useState(false)
  const [intervalDays, setIntervalDays] = useState(
    String(initialReminder?.interval_days ?? 30)
  )

  async function saveReminder() {
    setSaving(true)
    const days = parseInt(intervalDays)
    const nextDue = addDays(new Date(), days)

    if (reminder) {
      const { data, error } = await supabase
        .from('reminders')
        .update({ interval_days: days, next_due_at: nextDue.toISOString(), enabled: true })
        .eq('id', reminder.id)
        .select()
        .single()
      if (!error && data) setReminder(data)
    } else {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          person_id: personId,
          interval_days: days,
          next_due_at: nextDue.toISOString(),
          enabled: true,
        })
        .select()
        .single()
      if (!error && data) setReminder(data)
    }

    setSaving(false)
    toast({ title: 'Reminder saved' })
  }

  async function toggleReminder() {
    if (!reminder) return
    setSaving(true)
    const { data, error } = await supabase
      .from('reminders')
      .update({ enabled: !reminder.enabled })
      .eq('id', reminder.id)
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setReminder(data)
      toast({ title: data.enabled ? 'Reminder enabled' : 'Reminder paused' })
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Check-in Reminder</p>
      <div className="flex items-center gap-2">
        <Select value={intervalDays} onValueChange={setIntervalDays}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTERVALS.map((i) => (
              <SelectItem key={i.days} value={String(i.days)}>{i.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={saveReminder}
          disabled={saving}
        >
          Save
        </Button>
        {reminder && (
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleReminder}
            disabled={saving}
            title={reminder.enabled ? 'Pause reminder' : 'Enable reminder'}
          >
            {reminder.enabled ? (
              <Bell className="h-4 w-4 text-rose-500" strokeWidth={1.8} />
            ) : (
              <BellOff className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
            )}
          </Button>
        )}
      </div>
      {reminder?.enabled && (
        <p className="text-xs text-slate-400">
          Next reminder: {new Date(reminder.next_due_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
