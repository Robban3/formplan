import { dateKey } from './derive'
import { exerciseKey, migrateExerciseKeysOnce } from './exerciseKey'
import { getExerciseById } from './exerciseCatalog'
import { resolveExercise, type ExerciseRef } from './exerciseResolve'

const KEY = 'formplan_personal_records'

export interface PersonalRecord {
  /** Storage key: the catalog id when resolvable, otherwise the normalized name. */
  exercise: string
  /** Human-readable name to show in the UI. */
  name?: string
  weight_kg: number
  reps: number
  estimated_1rm: number
  date: string
}

function load(): PersonalRecord[] {
  // Re-keys any pre-v2 (name-keyed) records before the first read.
  migrateExerciseKeysOnce()
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as PersonalRecord[] }
  catch { return [] }
}

function save(records: PersonalRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records))
}

export function getPersonalRecords(): PersonalRecord[] {
  return load()
}

/** Display name for a record — catalog name when the key resolves. */
export function personalRecordLabel(record: PersonalRecord): string {
  return getExerciseById(record.exercise)?.name ?? record.name ?? record.exercise
}

/** Display name for a reference: catalog name when it resolves, else the raw name. */
function refLabel(exercise: ExerciseRef | string): string {
  const resolved = resolveExercise(exercise)
  if (resolved) return resolved.name
  return (typeof exercise === 'string' ? exercise : exercise.name ?? '') || ''
}

/**
 * `exercise` is the free-text name or a reference carrying
 * `exercise_id`/`exerciseId`; it is resolved to the catalog id internally.
 */
export function getPRForExercise(exercise: ExerciseRef | string): PersonalRecord | null {
  const key = exerciseKey(exercise)
  return load().find((r) => r.exercise === key) ?? null
}

/** Returns true if this is a new personal record (Epley 1RM comparison). */
export function checkAndUpdatePR(
  exercise: ExerciseRef | string,
  weight_kg: number,
  reps: number
): boolean {
  if (weight_kg <= 0 || reps <= 0) return false
  const est1rm = Math.round(weight_kg * (1 + reps / 30))
  const key = exerciseKey(exercise)
  const records = load()
  const existing = records.find((r) => r.exercise === key)
  if (existing && existing.estimated_1rm >= est1rm) return false

  const newRecord: PersonalRecord = {
    exercise: key,
    name: refLabel(exercise),
    weight_kg,
    reps,
    estimated_1rm: est1rm,
    date: dateKey(),
  }
  save([...records.filter((r) => r.exercise !== key), newRecord])
  return true
}
