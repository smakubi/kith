'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Loader2, Video } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Person } from '@/types'

interface ScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: Person
  userId: string
}

export function ScheduleModal({ open, onOpenChange, person, userId }: ScheduleModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // Default to tomorrow 10am
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)
  const tomorrowStr = tomorrow.toISOString().slice(0, 16)

  const [title, setTitle] = useState(`Catch up with ${person.name}`)
  const [startDateTime, setStartDateTime] = useState(tomorrowStr)
  const [duration, setDuration] = useState('60')
  const [addMeetLink, setAddMeetLink] = useState(false)

  async function handleSchedule() {
    setLoading(true)
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          startTime: startDateTime,
          durationMin: parseInt(duration),
          withMeet: addMeetLink,
          attendeeEmail: person.email ?? null,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Failed to create calendar event')
      }

      const { eventUrl } = await response.json()

      // Log interaction
      await supabase.from('interactions').insert({
        user_id: userId,
        person_id: person.id,
        type: 'meetup',
        note: `Scheduled: ${title}`,
        event_url: eventUrl,
        occurred_at: new Date(startDateTime).toISOString(),
      })

      toast({
        title: 'Event created!',
        description: `"${title}" added to Google Calendar.`,
      })
      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-rose-500" strokeWidth={1.8} />
            Schedule a Meetup
          </DialogTitle>
          <DialogDescription>
            Creates a Google Calendar event and logs the interaction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAddMeetLink(!addMeetLink)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
              addMeetLink
                ? 'border-sky-200 bg-sky-50 text-sky-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Video className="h-4 w-4" strokeWidth={1.8} />
              <span className="text-sm font-medium">Add Google Meet link</span>
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors ${addMeetLink ? 'bg-sky-500' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${addMeetLink ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSchedule} disabled={loading} className="bg-rose-500 hover:bg-rose-600">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
