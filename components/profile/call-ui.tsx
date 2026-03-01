'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Person } from '@/types'

// Dynamic import of Twilio SDK (browser only)
type TwilioDevice = any

interface CallUiProps {
  person: Person
  userId: string
}

type CallState = 'idle' | 'connecting' | 'active' | 'ended'

export function CallUi({ person, userId }: CallUiProps) {
  const router = useRouter()
  const supabase = createClient()
  const deviceRef = useRef<TwilioDevice | null>(null)
  const connectionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [callState, setCallState] = useState<CallState>('idle')
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [logNote, setLogNote] = useState('')

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  async function initDevice() {
    const { Device } = await import('@twilio/voice-sdk')
    const response = await fetch('/api/twilio/token')
    if (!response.ok) throw new Error('Failed to get token')
    const { token } = await response.json()
    const device = new Device(token, { logLevel: 1 })
    await device.register()
    deviceRef.current = device
    return device
  }

  async function startCall() {
    if (!person.phone) {
      toast({ title: 'No phone number', description: 'Add a phone number to this contact first.', variant: 'destructive' })
      return
    }
    setCallState('connecting')
    try {
      const device = deviceRef.current ?? await initDevice()
      const connection = await device.connect({ params: { To: person.phone } })
      connectionRef.current = connection
      connection.on('accept', () => {
        setCallState('active')
        setDuration(0)
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
      })
      connection.on('disconnect', () => handleCallEnded())
      connection.on('cancel', () => setCallState('idle'))
      connection.on('error', (err: any) => {
        toast({ title: 'Call error', description: err.message, variant: 'destructive' })
        setCallState('idle')
      })
    } catch (err: any) {
      toast({ title: 'Call failed', description: err.message, variant: 'destructive' })
      setCallState('idle')
    }
  }

  function handleCallEnded() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setCallState('ended')
    setLogOpen(true)
  }

  function hangUp() {
    connectionRef.current?.disconnect()
    handleCallEnded()
  }

  function toggleMute() {
    if (connectionRef.current) {
      connectionRef.current.mute(!muted)
      setMuted(!muted)
    }
  }

  async function logCall(log: boolean) {
    if (log) {
      const { error } = await supabase.from('interactions').insert({
        user_id: userId,
        person_id: person.id,
        type: 'call',
        note: logNote || null,
        duration_s: duration,
        occurred_at: new Date().toISOString(),
      })
      if (!error) {
        toast({ title: 'Call logged', description: `${Math.floor(duration / 60)}m ${duration % 60}s with ${person.name}` })
        router.refresh()
      }
    }
    setLogOpen(false)
    setLogNote('')
    setCallState('idle')
    setDuration(0)
  }

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (!person.phone) {
    return (
      <Button variant="outline" disabled size="sm" className="gap-2 opacity-50">
        <Phone className="h-3.5 w-3.5" strokeWidth={1.8} /> Call
      </Button>
    )
  }

  return (
    <>
      {callState === 'idle' && (
        <Button variant="outline" size="sm" className="gap-2" onClick={startCall}>
          <Phone className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.8} /> Call
        </Button>
      )}

      {callState === 'connecting' && (
        <Button variant="outline" size="sm" disabled className="gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting…
        </Button>
      )}

      {callState === 'active' && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-mono font-medium text-emerald-700">
              {formatDuration(duration)}
            </span>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={toggleMute}
            className={muted ? 'text-red-500' : 'text-emerald-600'}
          >
            {muted ? <MicOff className="h-3.5 w-3.5" strokeWidth={1.8} /> : <Mic className="h-3.5 w-3.5" strokeWidth={1.8} />}
          </Button>
          <Button
            size="icon-sm"
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={hangUp}
          >
            <PhoneOff className="h-3.5 w-3.5" strokeWidth={1.8} />
          </Button>
        </div>
      )}

      {/* Log call dialog */}
      <Dialog open={logOpen} onOpenChange={(o) => { if (!o) logCall(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log this call?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Call with {person.name} — {formatDuration(duration)}
          </p>
          <Textarea
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            placeholder="Any notes from the call? (optional)"
            rows={3}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => logCall(false)}>Skip</Button>
            <Button onClick={() => logCall(true)} className="bg-rose-500 hover:bg-rose-600">
              Log call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
