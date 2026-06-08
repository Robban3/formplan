const KEY = 'formplan_exercise_history'

export interface ExerciseEntry {
  date: string
  maxWeight_kg: number
  totalVolume_kg: number
  totalReps: number
}

type ExerciseHistory = Record<string, ExerciseEntry[]>

function load(): ExerciseHistory {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as ExerciseHistory }
  catch { return {} }
}

function save(h: ExerciseHistory) {
  localStorage.setItem(KEY, JSON.stringify(h))
}

export function getExerciseHistory(exercise: string): ExerciseEntry[] {
  const h = load()
  return (h[exercise] ?? []).sort((a, b) => a.date.localeCompare(b.date))
}

export function getAllTrackedExercises(): string[] {
  return Object.keys(load())
}

export function recordExerciseSession(
  exercise: string,
  date: string,
  sets: { reps: number; weight_kg: number | null; done: boolean }[]
) {
  const doneSets = sets.filter((s) => s.done && (s.weight_kg ?? 0) > 0)
  if (doneSets.length === 0) return

  const maxWeight = Math.max(...doneSets.map((s) => s.weight_kg!))
  const totalVolume = doneSets.reduce((sum, s) => sum + s.reps * (s.weight_kg ?? 0), 0)
  const totalReps = doneSets.reduce((sum, s) => sum + s.reps, 0)

  const h = load()
  const entries = h[exercise] ?? []
  const idx = entries.findIndex((e) => e.date === date)
  const entry: ExerciseEntry = {
    date,
    maxWeight_kg: maxWeight,
    totalVolume_kg: Math.round(totalVolume * 10) / 10,
    totalReps,
  }
  if (idx >= 0) entries[idx] = entry
  else entries.push(entry)
  h[exercise] = entries
  save(h)
}
