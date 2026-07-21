import { getLocalSessions } from './workoutSessionStore'
import { dateKey } from './derive'

// Local-noon Date for a YYYY-MM-DD key — stepping whole days from noon is
// immune to DST shifts, and dateKey() maps it back to the same key.
function localNoon(key: string): Date {
  return new Date(`${key}T12:00:00`)
}

/** Returns current streak (consecutive days with at least one workout, ending today or yesterday). */
export function getTrainingStreak(): number {
  const sessions = getLocalSessions()
  if (sessions.length === 0) return 0

  // Bucket sessions by the user's LOCAL day — UTC slicing would put sessions
  // logged 00:00–02:00 Swedish time on the previous day.
  const days = new Set(sessions.map((s) => dateKey(new Date(s.completed_at))))

  const today = dateKey()
  const yesterdayNoon = localNoon(today)
  yesterdayNoon.setDate(yesterdayNoon.getDate() - 1)
  const yesterday = dateKey(yesterdayNoon)

  // Streak must include today or yesterday to be "active"
  if (!days.has(today) && !days.has(yesterday)) return 0

  let streak = 0
  const cursor = localNoon(days.has(today) ? today : yesterday)

  while (days.has(dateKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

/** Returns longest ever streak. */
export function getLongestStreak(): number {
  const sessions = getLocalSessions()
  if (sessions.length === 0) return 0

  const days = [...new Set(sessions.map((s) => dateKey(new Date(s.completed_at))))].sort()
  if (days.length === 0) return 0

  let longest = 1, current = 1
  for (let i = 1; i < days.length; i++) {
    const prev = localNoon(days[i - 1]!)
    const curr = localNoon(days[i]!)
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diff === 1) { current++; longest = Math.max(longest, current) }
    else current = 1
  }
  return longest
}
