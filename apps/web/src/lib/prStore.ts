const KEY = 'formplan_personal_records'

export interface PersonalRecord {
  exercise: string
  weight_kg: number
  reps: number
  estimated_1rm: number
  date: string
}

function load(): PersonalRecord[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as PersonalRecord[] }
  catch { return [] }
}

function save(records: PersonalRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records))
}

export function getPersonalRecords(): PersonalRecord[] {
  return load()
}

export function getPRForExercise(exercise: string): PersonalRecord | null {
  return load().find((r) => r.exercise === exercise) ?? null
}

/** Returns true if this is a new personal record (Epley 1RM comparison). */
export function checkAndUpdatePR(exercise: string, weight_kg: number, reps: number): boolean {
  if (weight_kg <= 0 || reps <= 0) return false
  const est1rm = Math.round(weight_kg * (1 + reps / 30))
  const records = load()
  const existing = records.find((r) => r.exercise === exercise)
  if (existing && existing.estimated_1rm >= est1rm) return false

  const newRecord: PersonalRecord = {
    exercise,
    weight_kg,
    reps,
    estimated_1rm: est1rm,
    date: new Date().toISOString().slice(0, 10),
  }
  save([...records.filter((r) => r.exercise !== exercise), newRecord])
  return true
}
