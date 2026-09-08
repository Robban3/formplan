import { describe, it, expect, vi } from 'vitest'

// The stores touch localStorage at call time — stub it before importing them.
function makeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

const storage = makeStorage()
vi.stubGlobal('localStorage', storage)

const HISTORY_KEY = 'formplan_exercise_history'
const PR_KEY = 'formplan_personal_records'
const FLAG = 'formplan_exercise_key_v2'

// Legacy data keyed on the free-text exercise name: the same lift split across
// two names, plus one exercise that isn't in the catalog at all.
storage.setItem(
  HISTORY_KEY,
  JSON.stringify({
    'Bänkpress': [
      { date: '2026-01-01', maxWeight_kg: 80, repsAtMax: 8, totalVolume_kg: 1000, totalReps: 24 },
    ],
    'Bänkpress med skivstång': [
      { date: '2026-01-01', maxWeight_kg: 85, repsAtMax: 5, totalVolume_kg: 500, totalReps: 12 },
      { date: '2026-01-08', maxWeight_kg: 82.5, repsAtMax: 8, totalVolume_kg: 900, totalReps: 24 },
    ],
    'Xyzzy quux': [
      { date: '2026-01-02', maxWeight_kg: 20, repsAtMax: 10, totalVolume_kg: 200, totalReps: 10 },
    ],
  })
)
storage.setItem(
  PR_KEY,
  JSON.stringify([
    { exercise: 'Bänkpress', weight_kg: 80, reps: 8, estimated_1rm: 101, date: '2026-01-01' },
    { exercise: 'Bänkpress med skivstång', weight_kg: 85, reps: 5, estimated_1rm: 99, date: '2026-01-08' },
  ])
)

const { exerciseKey, normalizeExerciseName } = await import('./exerciseKey')
const { getExerciseHistory, getAllTrackedExercises } = await import('./exerciseHistoryStore')
const { getPRForExercise, getPersonalRecords } = await import('./prStore')

describe('exerciseKey', () => {
  it('maps name variants of the same lift to one catalog id', () => {
    expect(exerciseKey('Bänkpress')).toBe('bankpress')
    expect(exerciseKey('bänkpress med skivstång')).toBe('bankpress')
    expect(exerciseKey('Bench press')).toBe('bankpress')
  })

  it('falls back to a normalized name for exercises outside the catalog', () => {
    expect(exerciseKey('Xyzzy quux')).toBe(normalizeExerciseName('Xyzzy quux'))
    expect(normalizeExerciseName('  Höft-Lyft!! ')).toBe('hoft lyft')
  })

  it('prefers the catalog id on a reference, in both naming styles', () => {
    expect(exerciseKey({ exercise_id: 'bankpress' })).toBe('bankpress')
    // Från den lokala pass-loggen (camelCase).
    expect(exerciseKey({ name: 'Bänkpress', exerciseId: 'bankpress' })).toBe('bankpress')
    // Id:t vinner över ett namn som pekar på en annan övning.
    expect(exerciseKey({ name: 'Knäböj', exercise_id: 'bankpress' })).toBe('bankpress')
  })

  it('falls back to the name when the id is unknown', () => {
    expect(exerciseKey({ name: 'Bänkpress', exercise_id: 'finns-inte' })).toBe('bankpress')
    expect(exerciseKey({ name: 'Xyzzy quux', exercise_id: 'finns-inte' })).toBe('xyzzy quux')
  })

  it('never invents a key for an empty or unresolvable reference', () => {
    expect(exerciseKey({})).toBe('')
    expect(exerciseKey(null)).toBe('')
    expect(exerciseKey('💪')).toBe('')
  })
})

describe('ref-keyed reads', () => {
  it('reads the same series whether the ref carries an id or only a name', () => {
    const byName = getExerciseHistory('Bänkpress')
    expect(getExerciseHistory({ exercise_id: 'bankpress' })).toEqual(byName)
    expect(getExerciseHistory({ name: 'Bänkpress med skivstång' })).toEqual(byName)
    expect(getPRForExercise({ exerciseId: 'bankpress' })?.exercise).toBe('bankpress')
  })
})

describe('one-time migration to id keys', () => {
  it('merges name-keyed history into a single id-keyed series', () => {
    const entries = getExerciseHistory('Bänkpress')
    expect(entries).toHaveLength(2)
    // Same day, two old names: heaviest weight wins, volume and reps sum.
    expect(entries[0]).toEqual({
      date: '2026-01-01',
      maxWeight_kg: 85,
      repsAtMax: 5,
      totalVolume_kg: 1500,
      totalReps: 36,
    })
    expect(entries[1]?.date).toBe('2026-01-08')
    // Both old names now read the same series.
    expect(getExerciseHistory('Bänkpress med skivstång')).toEqual(entries)
  })

  it('keeps unmatched exercises under their normalized name', () => {
    expect(getExerciseHistory('Xyzzy quux')).toHaveLength(1)
    expect(getAllTrackedExercises().sort()).toEqual(['bankpress', 'xyzzy quux'])
  })

  it('collapses personal records on the same lift, keeping the heaviest', () => {
    const records = getPersonalRecords()
    expect(records).toHaveLength(1)
    const pr = getPRForExercise('Bänkpress med skivstång')
    expect(pr?.exercise).toBe('bankpress')
    expect(pr?.estimated_1rm).toBe(101)
    expect(pr?.name).toBe('Bänkpress')
  })

  it('runs only once', () => {
    expect(storage.getItem(FLAG)).toBe('1')
  })
})
