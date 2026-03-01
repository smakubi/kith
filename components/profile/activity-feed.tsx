'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Phone, MessageCircle, Mail, Users, FileText, Cake, Plus, Loader2,
} from 'lucide-react'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import type { Interaction, InteractionType } from '@/types'

const TYPE_ICONS: Record<InteractionType, React.FC<any>> = {
  call: Phone,
  message: MessageCircle,
  email: Mail,
  meetup: Users,
  note: FileText,
  birthday: Cake,
}

const TYPE_COLORS: Record<InteractionType, string> = {
  call: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  message: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  email: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  meetup: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  note: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  birthday: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
}

const TYPE_LABEL: Record<InteractionType, string> = {
  call: 'Phone call',
  message: 'Message',
  email: 'Email',
  meetup: 'Meetup',
  note: 'Note',
  birthday: 'Birthday',
}

interface ActivityFeedProps {
  interactions: Interaction[]
  personId: string
  userId: string
}

export function ActivityFeed({ interactions, personId, userId }: ActivityFeedProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('all')
  const [addNoteOpen, setAddNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered =
    activeTab === 'all'
      ? interactions
      : interactions.filter((i) => {
          if (activeTab === 'notes') return i.type === 'note'
          if (activeTab === 'calls') return i.type === 'call'
          if (activeTab === 'messages') return i.type === 'message'
          if (activeTab === 'emails') return i.type === 'email'
          if (activeTab === 'meetups') return i.type === 'meetup'
          return true
        })

  async function addNote() {
    if (!note.trim()) return
    setSaving(true)
    const { error } = await supabase.from('interactions').insert({
      user_id: userId,
      person_id: personId,
      type: 'note',
      note: note.trim(),
      occurred_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      setNote('')
      setAddNoteOpen(false)
      toast({ title: 'Note added' })
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="emails">Emails</TabsTrigger>
            <TabsTrigger value="meetups">Meetups</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" variant="outline" onClick={() => setAddNoteOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" strokeWidth={1.8} /> Add Note
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
            No {activeTab === 'all' ? 'interactions' : activeTab} yet.
          </div>
        ) : (
          filtered.map((interaction) => {
            const Icon = TYPE_ICONS[interaction.type]
            const colorClass = TYPE_COLORS[interaction.type]
            return (
              <div
                key={interaction.id}
                className="flex gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {TYPE_LABEL[interaction.type]}
                      {interaction.duration_s && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal ml-1.5">
                          {Math.floor(interaction.duration_s / 60)}m {interaction.duration_s % 60}s
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                      {formatRelativeDate(interaction.occurred_at)}
                    </span>
                  </div>
                  {interaction.note && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{interaction.note}</p>
                  )}
                  {interaction.event_url && (
                    <a
                      href={interaction.event_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-rose-500 hover:underline mt-1 inline-block"
                    >
                      View calendar event →
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Note Dialog */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What do you want to remember?"
            rows={4}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddNoteOpen(false)}>Cancel</Button>
            <Button onClick={addNote} disabled={saving || !note.trim()} className="bg-rose-500 hover:bg-rose-600">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
