'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Loader2, Bell, BellOff, LogOut, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single()

      setName(profile?.name ?? '')
      setEmail(profile?.email ?? user.email ?? '')
      setNotificationsEnabled(user.user_metadata?.notifications_enabled !== false)
      setLoading(false)
    }
    load()
  }, [])

  async function saveName() {
    if (!name.trim()) return
    setSavingName(true)
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', (await supabase.auth.getUser()).data.user!.id)
    setSavingName(false)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Name updated' })
    }
  }

  async function toggleNotifications() {
    const next = !notificationsEnabled
    setNotificationsEnabled(next)
    const { error } = await supabase.auth.updateUser({
      data: { notifications_enabled: next },
    })
    if (error) {
      setNotificationsEnabled(!next)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: next ? 'Notifications enabled' : 'Notifications disabled' })
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/login')
    } else {
      const { detail } = await res.json()
      toast({ title: 'Failed to delete account', description: detail, variant: 'destructive' })
      setDeleting(false)
    }
  }

  if (loading) return null

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Profile</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1"
                />
                <Button
                  onClick={saveName}
                  disabled={savingName || !name.trim()}
                  className="bg-rose-500 hover:bg-rose-600 shrink-0"
                >
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} disabled className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Notifications */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notifications</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notificationsEnabled
                  ? <Bell className="h-4 w-4 text-emerald-500" strokeWidth={1.8} />
                  : <BellOff className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                }
                <div>
                  <p className="text-sm font-medium text-foreground">Reminder emails</p>
                  <p className="text-xs text-muted-foreground">Get notified when it's time to reconnect</p>
                </div>
              </div>
              <button
                onClick={toggleNotifications}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative',
                  notificationsEnabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Account */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h2>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.8} /> Sign out
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.8} /> Delete account
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all your data — contacts, interactions, and reminders. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 gap-2"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" strokeWidth={1.8} />}
              Delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
