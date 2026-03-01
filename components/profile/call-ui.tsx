'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Person } from '@/types'

interface CallUiProps {
  person: Person
  userId: string
}

export function CallUi({ person, userId }: CallUiProps) {
  const router = useRouter()
  const supabase = createClient()
  const [logOpen, setLogOpen] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  function handleCallClick() {
    window.location.href = `tel:${person.phone}`
    setLogOpen(true)
  }

  async function logCall(save: boolean) {
    if (save) {
      setSaving(true)
      await supabase.from('interactions').insert({
        user_id: userId,
        person_id: person.id,
        type: 'call',
        note: note || null,
        occurred_at: new Date().toISOString(),
      })
      setSaving(false)
      toast({ title: 'Call logged' })
      router.refresh()
    }
    setNote('')
    setLogOpen(false)
  }

  if (!person.phone) {
    return (
      <Button variant="outline" disabled size="sm" className="gap-2 opacity-50">
        <Phone className="h-3.5 w-3.5" strokeWidth={1.8} /> Call
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={handleCallClick}>
        <Phone className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.8} /> Call
      </Button>

      <Dialog open={logOpen} onOpenChange={(o) => { if (!o) logCall(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log call with {person.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Your phone app should be opening. Add notes once you're done.
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notes from the call… (optional)"
            rows={3}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => logCall(false)}>Skip</Button>
            <Button onClick={() => logCall(true)} disabled={saving} className="bg-rose-500 hover:bg-rose-600">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
