'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Loader2, ArrowRight, CheckCircle2, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Relation, Circle } from '@/types'

type Step = 'profile' | 'contacts' | 'done'

interface ContactInput {
  name: string
  relation: Relation | ''
  circle: Circle | ''
}

const emptyContact = (): ContactInput => ({ name: '', relation: '', circle: '' })

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>('profile')
  const [loading, setLoading] = useState(false)

  // Profile step
  const [name, setName] = useState('')

  // Contacts step
  const [contacts, setContacts] = useState<ContactInput[]>([
    emptyContact(), emptyContact(), emptyContact(),
  ])

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', user.id)

    setLoading(false)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      setStep('contacts')
    }
  }

  async function handleContactsSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validContacts = contacts.filter((c) => c.name.trim())
    if (validContacts.length === 0) {
      setStep('done')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const rows = validContacts.map((c) => ({
      user_id: user.id,
      name: c.name.trim(),
      relation: c.relation || null,
      circle: c.circle || 'Close Friends',
    }))

    const { error } = await supabase.from('people').insert(rows)
    if (error) {
      toast({ title: 'Error saving contacts', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    // Mark onboarding complete
    await supabase.from('users').update({ onboarded: true }).eq('id', user.id)

    setLoading(false)
    setStep('done')
  }

  function updateContact(index: number, field: keyof ContactInput, value: string) {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">You&apos;re all set, {name}! 🎉</h2>
            <p className="text-slate-500 mt-2">Kith is ready to help you nurture your relationships.</p>
          </div>
          <Button
            className="bg-rose-500 hover:bg-rose-600 w-full"
            onClick={() => router.push('/')}
          >
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500 text-white text-2xl font-bold shadow-lg mb-4">
            K
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 'profile' ? "Let's set up your profile" : 'Add your first contacts'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {step === 'profile' ? 'Step 1 of 2' : 'Step 2 of 2'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {(['profile', 'contacts'] as const).map((s, i) => (
            <div
              key={s}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-colors',
                i === 0 && step !== 'profile' ? 'bg-rose-500' :
                s === step ? 'bg-rose-500' : 'bg-slate-200'
              )}
            />
          ))}
        </div>

        {step === 'profile' && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-600"
                  disabled={loading || !name.trim()}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'contacts' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-rose-500" />
                <p className="text-sm text-slate-600">
                  Add up to 3 people you want to stay connected with.
                </p>
              </div>
              <form onSubmit={handleContactsSubmit} className="space-y-4">
                {contacts.map((contact, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Contact {i + 1}
                    </p>
                    <Input
                      placeholder="Full name"
                      value={contact.name}
                      onChange={(e) => updateContact(i, 'name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={contact.relation}
                        onValueChange={(v) => updateContact(i, 'relation', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Relation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Friend">Friend</SelectItem>
                          <SelectItem value="Family">Family</SelectItem>
                          <SelectItem value="Mentor">Mentor</SelectItem>
                          <SelectItem value="Colleague">Colleague</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={contact.circle}
                        onValueChange={(v) => updateContact(i, 'circle', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Circle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inner Circle">Inner Circle</SelectItem>
                          <SelectItem value="Close Friends">Close Friends</SelectItem>
                          <SelectItem value="Social Circle">Social Circle</SelectItem>
                          <SelectItem value="Reconnect">Reconnect</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      supabase.from('users').update({ onboarded: true })
                      router.push('/')
                    }}
                  >
                    Skip for now
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-rose-500 hover:bg-rose-600"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save & continue
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
