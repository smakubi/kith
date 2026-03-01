'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import { CircleColumn } from './circle-column'
import { PersonCard } from './person-card'
import { PersonForm } from '@/components/people/person-form'
import { toast } from '@/hooks/use-toast'
import type { Person, Circle } from '@/types'
import { CIRCLE_ORDER } from '@/types'

interface CirclesBoardProps {
  initialPeople: Person[]
}

export function CirclesBoard({ initialPeople }: CirclesBoardProps) {
  const supabase = createClient()
  const [people, setPeople] = useState<Person[]>(initialPeople)
  const [activePerson, setActivePerson] = useState<Person | null>(null)
  const [addPersonOpen, setAddPersonOpen] = useState(false)
  const [defaultCircle, setDefaultCircle] = useState<Circle>('Close Friends')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const grouped = CIRCLE_ORDER.reduce<Record<Circle, Person[]>>((acc, circle) => {
    acc[circle] = people.filter((p) => p.circle === circle)
    return acc
  }, {} as Record<Circle, Person[]>)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const person = people.find((p) => p.id === event.active.id)
    setActivePerson(person ?? null)
  }, [people])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActivePerson(null)

    if (!over) return
    const personId = active.id as string
    const targetCircle = over.id as Circle

    const person = people.find((p) => p.id === personId)
    if (!person || person.circle === targetCircle) return

    // Optimistic update
    setPeople((prev) =>
      prev.map((p) => p.id === personId ? { ...p, circle: targetCircle } : p)
    )

    const { error } = await supabase
      .from('people')
      .update({ circle: targetCircle })
      .eq('id', personId)

    if (error) {
      // Revert on error
      setPeople((prev) =>
        prev.map((p) => p.id === personId ? { ...p, circle: person.circle } : p)
      )
      toast({
        title: 'Failed to move contact',
        description: error.message,
        variant: 'destructive',
      })
    }
  }, [people, supabase])

  function handleAddPerson(circle: Circle) {
    setDefaultCircle(circle)
    setAddPersonOpen(true)
  }

  function handlePersonSaved(savedPerson?: Person) {
    if (savedPerson) {
      setPeople((prev) => {
        const exists = prev.find((p) => p.id === savedPerson.id)
        return exists
          ? prev.map((p) => p.id === savedPerson.id ? savedPerson : p)
          : [...prev, savedPerson]
      })
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {CIRCLE_ORDER.map((circle) => (
            <CircleColumn
              key={circle}
              circle={circle}
              people={grouped[circle]}
              onAddPerson={() => handleAddPerson(circle)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activePerson && (
            <PersonCard person={activePerson} isDragOverlay />
          )}
        </DragOverlay>
      </DndContext>

      <PersonForm
        open={addPersonOpen}
        onOpenChange={setAddPersonOpen}
        defaultCircle={defaultCircle}
        onSaved={handlePersonSaved}
      />
    </>
  )
}
