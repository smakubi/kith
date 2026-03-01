import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { NotificationBell } from '@/components/layout/notification-bell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('name, email, onboarded')
    .eq('id', user.id)
    .single()

  // Redirect to onboarding if not completed
  if (profile && !profile.onboarded) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar userName={profile?.name} userEmail={profile?.email ?? user.email} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-slate-100 bg-white flex items-center justify-end px-6 shrink-0">
          <NotificationBell />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
