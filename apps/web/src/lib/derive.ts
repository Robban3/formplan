// Pure helpers shared across pages. Kept dependency-free so they're easy to test.

export type Difficulty = 'Lätt' | 'Medel' | 'Hög'

export interface WorkoutLike {
  duration_minutes: number
  exercises: { name: string }[]
}

// Derive a difficulty label from a workout's duration and exercise count.
export function deriveDifficulty(w: WorkoutLike): Difficulty {
  const exercises = w.exercises?.length ?? 0
  const duration = w.duration_minutes ?? 0
  if (duration >= 60 || exercises >= 8) return 'Hög'
  if (duration <= 30 || exercises <= 4) return 'Lätt'
  return 'Medel'
}

// ISO weekday for a Date: 1 = Monday … 7 = Sunday.
export function isoWeekday(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

// Local YYYY-MM-DD key for a date (used for day-scoped logs).
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// All local YYYY-MM-DD keys from `from` through `to` (inclusive).
export function dateKeysInRange(from: Date, to: Date): string[] {
  const keys: string[] = []
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  while (d <= end) {
    keys.push(dateKey(d))
    d.setDate(d.getDate() + 1)
  }
  return keys
}

// Monday 00:00:00 .. Sunday 23:59:59 of the week containing `date`.
export function weekRange(date: Date = new Date()): { from: Date; to: Date } {
  const offset = isoWeekday(date) - 1
  const from = new Date(date)
  from.setHours(0, 0, 0, 0)
  from.setDate(from.getDate() - offset)
  const to = new Date(from)
  to.setDate(from.getDate() + 6)
  to.setHours(23, 59, 59, 999)
  return { from, to }
}

// Count how many distinct days in the given week had a completed session.
export function sessionsThisWeek(completedAt: string[], now: Date = new Date()): number {
  const { from, to } = weekRange(now)
  const days = new Set<string>()
  for (const iso of completedAt) {
    const d = new Date(iso)
    if (d >= from && d <= to) days.add(dateKey(d))
  }
  return days.size
}

/** Antal avslutade pass denna vecka (inte bara unika dagar). */
export function sessionsCountThisWeek(completedAt: string[], now: Date = new Date()): number {
  const { from, to } = weekRange(now)
  return completedAt.filter((iso) => {
    const d = new Date(iso)
    return d >= from && d <= to
  }).length
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Sessions-per-week for the last `weeks` weeks, oldest first; last entry is the
// current week.
export function weeklyCounts(
  completedAt: string[],
  weeks = 8,
  now: Date = new Date()
): number[] {
  const currentMonday = weekRange(now).from
  const buckets = Array.from({ length: weeks }, () => 0)
  for (const iso of completedAt) {
    const monday = weekRange(new Date(iso)).from
    const diff = Math.round((currentMonday.getTime() - monday.getTime()) / WEEK_MS)
    if (diff >= 0 && diff < weeks) {
      const idx = weeks - 1 - diff
      buckets[idx] = (buckets[idx] ?? 0) + 1
    }
  }
  return buckets
}
