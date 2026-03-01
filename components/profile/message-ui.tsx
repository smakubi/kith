'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Person } from '@/types'

interface MessageUiProps {
  person: Person
  userId: string
}

export function MessageUi({ person, userId }: MessageUiProps) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function sendMessage() {
    if (!body.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/twilio/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: person.phone, body: body.trim() }),
      })

      if (!res.ok) {
        const { detail } = await res.json()
        throw new Error(detail ?? 'Failed to send')
      }

      await supabase.from('interactions').insert({
        user_id: userId,
        person_id: person.id,
        type: 'message',
        note: body.trim(),
        occurred_at: new Date().toISOString(),
      })

      toast({ title: 'Message sent', description: `SMS delivered to ${person.name}` })
      setBody('')
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' })
    } finally {
      setSending(false)
    }
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
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <MessageCircle className="h-3.5 w-3.5 text-sky-600" strokeWidth={1.8} /> Message
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) { setBody(''); setSending(false) } setOpen(o) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {person.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">{person.phone}</p>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message…"
            rows={4}
            autoFocus
            maxLength={1600}
          />
          <p className="text-xs text-slate-400 text-right">{body.length} / 160</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={sendMessage}
              disabled={!body.trim() || sending}
              className="gap-2 bg-sky-500 hover:bg-sky-600"
            >
              {sending
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                : <><Send className="h-3.5 w-3.5" strokeWidth={1.8} /> Send</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
