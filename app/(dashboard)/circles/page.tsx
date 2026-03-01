import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CirclesBoard } from '@/components/circles/circles-board'
import type { Person } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CirclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: people = [] } = await supabase
    .from('people')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Circles</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Drag contacts between circles to adjust relationship depth.
        </p>
      </div>

      <CirclesBoard initialPeople={people as Person[]} />
    </div>
  )
}
