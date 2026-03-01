'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PersonForm } from './person-form'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  UserPlus, Search, MoreHorizontal, Pencil, Trash2, Phone, MessageCircle,
} from 'lucide-react'
import {
  initials, lastContactedColor, lastContactedLabel, formatBirthday,
} from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import type { Person, Relation, Circle } from '@/types'

interface PeopleTableProps {
  initialPeople: Person[]
}

const RELATION_VARIANT: Record<Relation, any> = {
  Friend: 'friend', Family: 'family', Mentor: 'mentor', Colleague: 'colleague',
}
const CIRCLE_VARIANT: Record<Circle, any> = {
  'Inner Circle': 'inner', 'Close Friends': 'close', 'Social Circle': 'social', Reconnect: 'reconnect',
}

const PAGE_SIZE = 20

export function PeopleTable({ initialPeople }: PeopleTableProps) {
  const router = useRouter()
  const supabase = createClient()

  const [people, setPeople] = useState<Person[]>(initialPeople)
  const [search, setSearch] = useState('')
  const [relationFilter, setRelationFilter] = useState<string>('all')
  const [circleFilter, setCircleFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [editPerson, setEditPerson] = useState<Person | null>(null)

  const filtered = people.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
    const matchesRelation = relationFilter === 'all' || p.relation === relationFilter
    const matchesCircle = circleFilter === 'all' || p.circle === circleFilter
    return matchesSearch && matchesRelation && matchesCircle
  })

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  async function deletePerson(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    const { error } = await supabase.from('people').delete().eq('id', id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      setPeople((prev) => prev.filter((p) => p.id !== id))
      toast({ title: `${name} removed` })
    }
  }

  async function logInteraction(person: Person, type: 'call' | 'message') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('interactions').insert({
      user_id: user.id,
      person_id: person.id,
      type,
      occurred_at: new Date().toISOString(),
    })
    if (!error) {
      toast({ title: `${type === 'call' ? 'Call' : 'Message'} logged with ${person.name}` })
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={1.8} />
          <Input
            placeholder="Search people…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-9"
          />
        </div>
        <Select value={relationFilter} onValueChange={(v) => { setRelationFilter(v); setPage(0) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Relation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All relations</SelectItem>
            <SelectItem value="Friend">Friend</SelectItem>
            <SelectItem value="Family">Family</SelectItem>
            <SelectItem value="Mentor">Mentor</SelectItem>
            <SelectItem value="Colleague">Colleague</SelectItem>
          </SelectContent>
        </Select>
        <Select value={circleFilter} onValueChange={(v) => { setCircleFilter(v); setPage(0) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Circle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All circles</SelectItem>
            <SelectItem value="Inner Circle">Inner Circle</SelectItem>
            <SelectItem value="Close Friends">Close Friends</SelectItem>
            <SelectItem value="Social Circle">Social Circle</SelectItem>
            <SelectItem value="Reconnect">Reconnect</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-rose-500 hover:bg-rose-600 ml-auto gap-2"
        >
          <UserPlus className="h-4 w-4" strokeWidth={1.8} />
          Add Person
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-64">Name</TableHead>
              <TableHead>Relation</TableHead>
              <TableHead>Circle</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Birthday</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                  {search || relationFilter !== 'all' || circleFilter !== 'all'
                    ? 'No people match your filters.'
                    : 'No people yet. Add your first contact!'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((person) => (
                <TableRow key={person.id} className="group">
                  <TableCell>
                    <Link href={`/people/${person.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={person.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{initials(person.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900">{person.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {person.relation && (
                      <Badge variant={RELATION_VARIANT[person.relation]}>{person.relation}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {person.circle && (
                      <Badge variant={CIRCLE_VARIANT[person.circle]}>{person.circle}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{person.location ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${lastContactedColor(person.last_contacted_at)}`}>
                      {lastContactedLabel(person.last_contacted_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{formatBirthday(person.birthday)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Log call"
                        onClick={() => logInteraction(person, 'call')}
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.8} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Log message"
                        onClick={() => logInteraction(person, 'message')}
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.8} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.8} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditPerson(person)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" strokeWidth={1.8} /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => deletePerson(person.id, person.name)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" strokeWidth={1.8} /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit forms */}
      <PersonForm open={addOpen} onOpenChange={setAddOpen} />
      {editPerson && (
        <PersonForm
          open={!!editPerson}
          onOpenChange={(o) => { if (!o) setEditPerson(null) }}
          person={editPerson}
        />
      )}
    </div>
  )
}
