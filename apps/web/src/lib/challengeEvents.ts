// Wires real app events (finished workout, water log, weight log) to the
// challenge progress in challengesStore. All handlers are cheap, synchronous
// over localStorage-backed stores, and must never throw into the calling flow.

import { getActiveChallenges, updateChallengeProgress } from './challengesStore'
import { getLocalSessions } from './workoutSessionStore'
import { getWaterLoggedDays } from './waterStore'
import { getWeightEntries } from './weightStore'
import { dateKey } from './derive'

/** Training challenges: pass count / lifted volume since the challenge started. */
export function notifyWorkoutLogged() {
  try {
    const challenges = getActiveChallenges().filter((c) => c.category === 'training')
    if (challenges.length === 0) return
    const sessions = getLocalSessions()
    for (const c of challenges) {
      if (!c.startDate) continue
      const since = sessions.filter((s) => s.completed_at.slice(0, 10) >= c.startDate!)
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
    let streak = 0
    const d = new Date()
    while (logged.has(dateKey(d))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    for (const c of challenges) {
      if (c.startDate) updateChallengeProgress(c.id, streak)
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
    const current = entries[entries.length - 1]!
    for (const c of challenges) {
      if (!c.startDate) continue
      // Baseline: latest entry on/before the start date, else the first entry.
      const baseline =
        [...entries].reverse().find((e) => e.date <= c.startDate!) ?? entries[0]!
      const lost = Math.max(0, baseline.weight_kg - current.weight_kg)
      updateChallengeProgress(c.id, Math.round(lost * 10) / 10)
    }
  } catch {
    /* never break weight logging */
  }
}
