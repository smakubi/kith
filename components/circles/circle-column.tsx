'use client'

import { useDroppable } from '@dnd-kit/core'
import { PersonCard } from './person-card'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import type { Person, Circle } from '@/types'
import { CIRCLE_COLORS } from '@/types'

interface CircleColumnProps {
  circle: Circle
  people: Person[]
  onAddPerson?: () => void
}

const CIRCLE_DESCRIPTIONS: Record<Circle, string> = {
  'Inner Circle': 'People you talk to weekly',
  'Close Friends': 'Monthly catch-ups',
  'Social Circle': 'Quarterly check-ins',
  Reconnect: 'People you want to reconnect with',
}

export function CircleColumn({ circle, people, onAddPerson }: CircleColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: circle })
  const colorStyle = CIRCLE_COLORS[circle]

  return (
    <div className="flex flex-col min-h-[500px]">
      {/* Column header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${colorStyle.bg} ${colorStyle.text}`}>
              {people.length}
            </span>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{circle}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-slate-400 dark:text-slate-500 hover:text-rose-500"
            onClick={onAddPerson}
          >
            <UserPlus className="h-3.5 w-3.5" strokeWidth={1.8} />
          </Button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">{CIRCLE_DESCRIPTIONS[circle]}</p>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={[
          'flex-1 rounded-2xl p-2 space-y-2 transition-colors duration-150 min-h-[200px]',
          isOver ? 'bg-rose-50 dark:bg-rose-950/20 ring-2 ring-rose-200 dark:ring-rose-800' : 'bg-slate-50 dark:bg-slate-800/30',
        ].join(' ')}
      >
        {people.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}
        {people.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">Drop contacts here</p>
          </div>
        )}
      </div>
    </div>
  )
}
