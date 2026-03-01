import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, differenceInDays, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date helpers ──────────────────────────────────────────────

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function formatRelativeDate(date: string | null | undefined): string {
  if (!date) return 'Never'
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true })
  } catch {
    return '—'
  }
}

export function lastContactedColor(lastContactedAt: string | null): string {
  if (!lastContactedAt) return 'text-red-500'
  const days = differenceInDays(new Date(), parseISO(lastContactedAt))
  if (days < 7) return 'text-emerald-600'
  if (days <= 30) return 'text-amber-600'
  return 'text-red-500'
}

export function lastContactedLabel(lastContactedAt: string | null): string {
  if (!lastContactedAt) return 'Never'
  const days = differenceInDays(new Date(), parseISO(lastContactedAt))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function daysUntilBirthday(birthday: string | null): number | null {
  if (!birthday) return null
  const today = new Date()
  const bday = parseISO(birthday)
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  let diff = differenceInDays(thisYear, today)
  if (diff < 0) {
    const nextYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate())
    diff = differenceInDays(nextYear, today)
  }
  return diff
}

export function formatBirthday(birthday: string | null): string {
  if (!birthday) return '—'
  try {
    return format(parseISO(birthday), 'MMMM d')
  } catch {
    return '—'
  }
}

// ── String helpers ────────────────────────────────────────────

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '…'
}

// ── URL helpers ───────────────────────────────────────────────

export function avatarFallbackUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f43f5e&color=fff&bold=true`
}

// ── Array helpers ─────────────────────────────────────────────

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = String(item[key])
      if (!acc[k]) acc[k] = []
      acc[k].push(item)
      return acc
    },
    {} as Record<string, T[]>,
  )
}
