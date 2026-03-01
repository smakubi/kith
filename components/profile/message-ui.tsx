'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Person } from '@/types'

interface MessageUiProps {
  person: Person
  userId: string
}

export function MessageUi({ person, userId }: MessageUiProps) {
  const router = useRouter()
  const supabase = createClient()
  const [logOpen, setLogOpen] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  function handleMessageClick() {
    window.location.href = `sms:${person.phone}`
    setLogOpen(true)
  }

  async function logMessage(save: boolean) {
    if (save) {
      setSaving(true)
      await supabase.from('interactions').insert({
        user_id: userId,
        person_id: person.id,
        type: 'message',
        note: note || null,
        occurred_at: new Date().toISOString(),
      })
      setSaving(false)
      toast({ title: 'Message logged' })
      router.refresh()
    }
    setNote('')
    setLogOpen(false)
  }

  if (!person.phone) {
    return (
      <Button variant="outline" disabled size="sm" className="gap-2 opacity-50">
        <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} /> Message
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={handleMessageClick}>
        <MessageCircle className="h-3.5 w-3.5 text-sky-600" strokeWidth={1.8} /> Message
      </Button>

      <Dialog open={logOpen} onOpenChange={(o) => { if (!o) logMessage(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log message to {person.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Your messaging app should be opening. Add notes about the conversation.
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was the conversation about? (optional)"
            rows={3}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => logMessage(false)}>Skip</Button>
            <Button onClick={() => logMessage(true)} disabled={saving} className="bg-rose-500 hover:bg-rose-600">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
