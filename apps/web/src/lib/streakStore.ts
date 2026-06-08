import { getLocalSessions } from './workoutSessionStore'

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function startOfDay(iso: string): Date {
  return new Date(iso + 'T00:00:00')
}

/** Returns current streak (consecutive days with at least one workout, ending today or yesterday). */
export function getTrainingStreak(): number {
  const sessions = getLocalSessions()
  if (sessions.length === 0) return 0

  const days = new Set(sessions.map((s) => s.completed_at.slice(0, 10)))
  const sorted = [...days].sort().reverse() // newest first

  const today = isoDate(new Date())
  const yesterday = isoDate(new Date(Date.now() - 86400000))

  // Streak must include today or yesterday to be "active"
  if (!days.has(today) && !days.has(yesterday)) return 0

  let streak = 0
  let cursor = new Date(days.has(today) ? today : yesterday)

  for (;;) {
    const dateStr = isoDate(cursor)
    if (!days.has(dateStr)) break
    streak++
    cursor = new Date(startOfDay(dateStr).getTime() - 86400000)
  }

  return streak
}

/** Returns longest ever streak. */
export function getLongestStreak(): number {
  const sessions = getLocalSessions()
  if (sessions.length === 0) return 0

  const days = [...new Set(sessions.map((s) => s.completed_at.slice(0, 10)))].sort()
  if (days.length === 0) return 0

  let longest = 1, current = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]! + 'T12:00:00')
    const curr = new Date(days[i]! + 'T12:00:00')
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diff === 1) { current++; longest = Math.max(longest, current) }
    else current = 1
  }
  return longest
}
