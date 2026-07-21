// Wires real app events (finished workout, water log, weight log) to the
// challenge progress in challengesStore. All handlers are cheap, synchronous
// over localStorage-backed stores, and must never throw into the calling flow.

import { getActiveChallenges, updateChallengeProgress } from './challengesStore'
import { getLocalSessions } from './workoutSessionStore'
import { getWaterLoggedDays } from './waterStore'
import { getWeightEntries } from './weightStore'
import { dateKey } from './derive'

/**
 * Last calendar day (inclusive, local YYYY-MM-DD) a contribution may count for
 * a time-boxed challenge — `startDate + durationDays - 1`. Returns null for
 * open-ended challenges (no positive durationDays). Kept consistent with the
 * water challenge's window handling so every category expires the same way.
 */
function windowEndKey(c: { startDate: string | null; durationDays: number }): string | null {
  if (!c.startDate || !(c.durationDays > 0)) return null
  const end = new Date(`${c.startDate}T12:00:00`)
  end.setDate(end.getDate() + c.durationDays - 1)
  return dateKey(end)
}

/** Training challenges: pass count / lifted volume since the challenge started. */
export function notifyWorkoutLogged() {
  try {
    const challenges = getActiveChallenges().filter((c) => c.category === 'training')
    if (challenges.length === 0) return
    const sessions = getLocalSessions()
    for (const c of challenges) {
      if (!c.startDate) continue
      const end = windowEndKey(c)
      const since = sessions.filter((s) => {
        const day = s.completed_at.slice(0, 10)
        // Only sessions within [startDate, startDate + durationDays) count — a
        // pass logged after the window has closed must not push a stale,
        // time-boxed challenge to completion.
        if (day < c.startDate!) return false
        if (end && day > end) return false
        return true
      })
      if (c.id === 'volume-10k') {
        const volume = since.reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0)
        updateChallengeProgress(c.id, Math.round(volume))
      } else {
        // streak-30, sessions-20, sessions-50: completed sessions since start.
        updateChallengeProgress(c.id, since.length)
      }
    }
  } catch {
    /* challenge tracking must never break workout logging */
  }
}

/** Water challenge (water-14): consecutive days with logged water, ending today. */
export function notifyWaterLogged() {
  try {
    const challenges = getActiveChallenges().filter((c) => c.category === 'nutrition')
    if (challenges.length === 0) return
    const logged = getWaterLoggedDays()
    for (const c of challenges) {
      if (!c.startDate) continue
      const start = new Date(`${c.startDate}T12:00:00`)
      // Walk backwards from today (or, if the challenge window has passed,
      // from the window's last day) counting consecutive logged days. Days
      // before the challenge started never count — a pre-existing streak must
      // not instantly complete a fresh challenge.
      const cursor = new Date()
      cursor.setHours(12, 0, 0, 0)
      if (c.durationDays > 0) {
        const windowEnd = new Date(start)
        windowEnd.setDate(windowEnd.getDate() + c.durationDays - 1)
        if (cursor > windowEnd) cursor.setTime(windowEnd.getTime())
      }
      let streak = 0
      while (cursor >= start && logged.has(dateKey(cursor))) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }
      updateChallengeProgress(c.id, streak)
    }
  } catch {
    /* never break water logging */
  }
}

/** Body challenge (weight-5): kg lost since the challenge started. */
export function notifyWeightLogged() {
  try {
    const challenges = getActiveChallenges().filter((c) => c.category === 'body')
    if (challenges.length === 0) return
    const entries = getWeightEntries() // sorted by date asc
    if (entries.length === 0) return
    for (const c of challenges) {
      if (!c.startDate) continue
      // Baseline: latest entry on/before the start date, else the first entry.
      const baseline =
        [...entries].reverse().find((e) => e.date <= c.startDate!) ?? entries[0]!
      // Current: latest entry within the challenge window — weigh-ins logged
      // after the window closed must not keep advancing a time-boxed challenge.
      const end = windowEndKey(c)
      const current =
        (end ? [...entries].reverse().find((e) => e.date <= end) : entries[entries.length - 1]) ??
        entries[entries.length - 1]!
      const lost = Math.max(0, baseline.weight_kg - current.weight_kg)
      updateChallengeProgress(c.id, Math.round(lost * 10) / 10)
    }
  } catch {
    /* never break weight logging */
  }
}
