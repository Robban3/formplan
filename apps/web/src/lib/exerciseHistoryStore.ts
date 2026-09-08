import { exerciseKey, mergeExerciseEntries, migrateExerciseKeysOnce } from './exerciseKey'
import type { ExerciseRef } from './exerciseResolve'

const KEY = 'formplan_exercise_history'

export interface ExerciseEntry {
  date: string
  maxWeight_kg: number
  repsAtMax: number // best reps achieved on the heaviest set — drives progression
  totalVolume_kg: number
  totalReps: number
}

type ExerciseHistory = Record<string, ExerciseEntry[]>

function load(): ExerciseHistory {
  // Re-keys any pre-v2 (name-keyed) data before the first read.
  migrateExerciseKeysOnce()
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as ExerciseHistory }
  catch { return {} }
}

function save(h: ExerciseHistory) {
  localStorage.setItem(KEY, JSON.stringify(h))
}

/**
 * History for an exercise. `exercise` is either the free-text name shown in the
 * UI or a reference carrying `exercise_id`/`exerciseId`; it is resolved to the
 * catalog id internally, so "Bänkpress" and "Bänkpress med skivstång" share one
 * series instead of splitting into two.
 */
export function getExerciseHistory(exercise: ExerciseRef | string): ExerciseEntry[] {
  const h = load()
  return (h[exerciseKey(exercise)] ?? []).sort((a, b) => a.date.localeCompare(b.date))
}

/** Storage keys (catalog ids where resolvable), not display names. */
export function getAllTrackedExercises(): string[] {
  return Object.keys(load())
}

export function recordExerciseSession(
  exercise: ExerciseRef | string,
  date: string,
  sets: { reps: number; weight_kg: number | null; done: boolean }[]
) {
  const doneSets = sets.filter((s) => s.done && (s.weight_kg ?? 0) > 0)
  if (doneSets.length === 0) return

  const maxWeight = Math.max(...doneSets.map((s) => s.weight_kg!))
  const repsAtMax = Math.max(
    ...doneSets.filter((s) => s.weight_kg === maxWeight).map((s) => s.reps)
  )
  const totalVolume = doneSets.reduce((sum, s) => sum + s.reps * (s.weight_kg ?? 0), 0)
  const totalReps = doneSets.reduce((sum, s) => sum + s.reps, 0)

  const entry: ExerciseEntry = {
    date,
    maxWeight_kg: maxWeight,
    repsAtMax,
    totalVolume_kg: Math.round(totalVolume * 10) / 10,
    totalReps,
  }

  const key = exerciseKey(exercise)
  const h = load()
  const entries = h[key] ?? []
  const idx = entries.findIndex((e) => e.date === date)
  if (idx >= 0) {
    // Merge with the earlier entry for the same day: a second workout must add
    // to the day's volume/reps, never overwrite it. maxWeight is the heaviest
    // across both sessions, and repsAtMax follows whichever session set it.
    entries[idx] = mergeExerciseEntries(entries[idx]!, entry)
  } else {
    entries.push(entry)
  }
  h[key] = entries
  save(h)
}
