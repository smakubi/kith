'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { toast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import type { Person, Relation, Circle } from '@/types'

interface PersonFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person?: Person | null
  defaultCircle?: Circle
  onSaved?: (person?: Person) => void
}

export function PersonForm({ open, onOpenChange, person, defaultCircle, onSaved }: PersonFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: person?.name ?? '',
    email: person?.email ?? '',
    phone: person?.phone ?? '',
    location: person?.location ?? '',
    relation: (person?.relation ?? '') as Relation | '',
    circle: (person?.circle ?? defaultCircle ?? '') as Circle | '',
    birthday: person?.birthday ?? '',
    how_met: person?.how_met ?? '',
    notes: person?.notes ?? '',
    tags: person?.tags?.join(', ') ?? '',
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const payload = {
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      location: form.location || null,
      relation: form.relation || null,
      circle: form.circle || null,
      birthday: form.birthday || null,
      how_met: form.how_met || null,
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    }

    let error, savedData: Person | undefined
    if (person) {
      const res = await supabase.from('people').update(payload).eq('id', person.id).select().single()
      error = res.error
      savedData = res.data as Person | undefined
    } else {
      const res = await supabase.from('people').insert({ ...payload, user_id: user.id }).select().single()
      error = res.error
      savedData = res.data as Person | undefined
    }

    setLoading(false)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: person ? 'Contact updated' : 'Contact added',
        description: `${form.name} has been ${person ? 'updated' : 'added'}.`,
        variant: 'success' as any,
      })
      onOpenChange(false)
      if (onSaved) {
        onSaved(savedData)
      } else {
        router.refresh()
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{person ? 'Edit Contact' : 'Add New Contact'}</SheetTitle>
          <SheetDescription>
            {person ? 'Update the details for this contact.' : 'Fill in the details to add a new person to your network.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" required />
          </div>

          {/* Relation & Circle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Relation</Label>
              <Select value={form.relation} onValueChange={(v) => update('relation', v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Friend">Friend</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Mentor">Mentor</SelectItem>
                  <SelectItem value="Colleague">Colleague</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Circle</Label>
              <Select value={form.circle} onValueChange={(v) => update('circle', v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inner Circle">Inner Circle</SelectItem>
                  <SelectItem value="Close Friends">Close Friends</SelectItem>
                  <SelectItem value="Social Circle">Social Circle</SelectItem>
                  <SelectItem value="Reconnect">Reconnect</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 555 123 4567" />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="City, Country" />
          </div>

          {/* Birthday */}
          <div className="space-y-1.5">
            <Label htmlFor="birthday">Birthday</Label>
            <Input id="birthday" type="date" value={form.birthday} onChange={(e) => update('birthday', e.target.value)} />
          </div>

          {/* How met */}
          <div className="space-y-1.5">
            <Label htmlFor="how_met">How you met</Label>
            <Input id="how_met" value={form.how_met} onChange={(e) => update('how_met', e.target.value)} placeholder="At a conference, through mutual friend…" />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Interests, things to remember…" rows={3} />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="hiking, design, coffee (comma-separated)" />
          </div>

          <SheetFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-500 hover:bg-rose-600" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {person ? 'Save changes' : 'Add contact'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
