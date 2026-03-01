import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PeopleTable } from '@/components/people/people-table'

export const dynamic = 'force-dynamic'

export default async function PeoplePage() {
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
        <h1 className="text-2xl font-bold text-slate-900">People</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {people.length} {people.length === 1 ? 'person' : 'people'} in your network.
        </p>
      </div>
      <PeopleTable initialPeople={people} />
    </div>
  )
}
