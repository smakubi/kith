'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Send, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Person } from '@/types'

interface EmailUiProps {
  person: Person
  userId: string
}

export function EmailUi({ person, userId }: EmailUiProps) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  function handleClose() {
    setSubject('')
    setBody('')
    setSending(false)
    setOpen(false)
  }

  async function sendEmail() {
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: person.email, subject: subject.trim(), body: body.trim() }),
      })

      if (!res.ok) {
        const { detail } = await res.json()
        throw new Error(detail ?? 'Failed to send')
      }

      await supabase.from('interactions').insert({
        user_id: userId,
        person_id: person.id,
        type: 'message',
        note: `Email: ${subject.trim()}\n\n${body.trim()}`,
        occurred_at: new Date().toISOString(),
      })

      toast({ title: 'Email sent', description: `Delivered to ${person.name}` })
      handleClose()
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  if (!person.email) {
    return (
      <Button variant="outline" disabled size="sm" className="gap-2 opacity-50">
        <Mail className="h-3.5 w-3.5" strokeWidth={1.8} /> Email
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Mail className="h-3.5 w-3.5 text-violet-600" strokeWidth={1.8} /> Email
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email {person.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">{person.email}</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject…"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button
              onClick={sendEmail}
              disabled={!subject.trim() || !body.trim() || sending}
              className="gap-2 bg-violet-500 hover:bg-violet-600"
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
