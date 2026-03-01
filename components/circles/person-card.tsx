'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials, lastContactedColor, lastContactedLabel } from '@/lib/utils'
import type { Person } from '@/types'
import { RELATION_COLORS } from '@/types'
import { MapPin, GripVertical } from 'lucide-react'

interface PersonCardProps {
  person: Person
  isDragOverlay?: boolean
}

export function PersonCard({ person, isDragOverlay = false }: PersonCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: person.id,
    data: { person },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const relationStyle = person.relation ? RELATION_COLORS[person.relation] : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group relative bg-white rounded-xl border border-slate-100 shadow-sm p-3',
        'flex items-start gap-3 cursor-grab active:cursor-grabbing',
        'hover:border-rose-200 hover:shadow-md transition-all duration-150',
        isDragging ? 'opacity-30 scale-95' : '',
        isDragOverlay ? 'shadow-xl border-rose-200 rotate-1 cursor-grabbing' : '',
      ].join(' ')}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className="mt-0.5 text-slate-300 hover:text-slate-500 transition-colors shrink-0"
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.8} />
      </div>

      {/* Avatar */}
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={person.avatar_url ?? undefined} />
        <AvatarFallback className="text-sm font-medium">{initials(person.name)}</AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/people/${person.id}`}
          className="block font-medium text-sm text-slate-900 hover:text-rose-500 transition-colors truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {person.name}
        </Link>

        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {person.relation && relationStyle && (
            <span className={`text-[10px] font-semibold px-1.5 py-px rounded-full ${relationStyle.bg} ${relationStyle.text}`}>
              {person.relation}
            </span>
          )}
          {person.location && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <MapPin className="h-2.5 w-2.5" strokeWidth={1.8} />
              {person.location}
            </span>
          )}
        </div>

        {/* Last contacted dot */}
        <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-medium ${lastContactedColor(person.last_contacted_at)}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
          {lastContactedLabel(person.last_contacted_at)}
        </div>
      </div>
    </div>
  )
}
