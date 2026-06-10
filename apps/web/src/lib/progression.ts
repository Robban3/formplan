import type { ExerciseEntry } from './exerciseHistoryStore'

export interface ProgressionAdvice {
  lastWeight_kg: number
  recommendedWeight_kg: number
  reachedReps: number
  targetReps: number
}

/** Top of a rep range string: "8-12" → 12, "10" → 10, "AMRAP"/"max" → null. */
export function parseTopReps(targetReps: string): number | null {
  const nums = targetReps.match(/\d+/g)
  if (!nums || nums.length === 0) return null
  return Math.max(...nums.map(Number))
}

/** Smaller jumps for light (isolation) loads, 2.5 kg for everything heavier. */
function increment(weightKg: number): number {
  const inc = weightKg < 20 ? 1.25 : 2.5
  return Math.round((weightKg + inc) * 100) / 100
}

/**
 * Double-progression rule: when the lifter has hit the top of the prescribed
 * rep range at the same working weight for the two most recent sessions,
 * recommend a small load increase. Returns null when there isn't enough
 * history, the exercise is bodyweight/AMRAP, or the target isn't met yet.
 *
 * `entries` is ascending by date (as returned by getExerciseHistory).
 */
export function recommendNextWeight(
  entries: ExerciseEntry[],
  targetReps: string
): ProgressionAdvice | null {
  const top = parseTopReps(targetReps)
  if (top === null) return null

  // Sessions that recorded a real working weight and reps at that weight.
  const usable = entries.filter(
    (e) => e.maxWeight_kg > 0 && typeof e.repsAtMax === 'number'
  )
  if (usable.length < 2) return null

  const last = usable[usable.length - 1]!
  const prev = usable[usable.length - 2]!

  const sameWeight = last.maxWeight_kg === prev.maxWeight_kg
  const bothHitTop = last.repsAtMax >= top && prev.repsAtMax >= top

  if (sameWeight && bothHitTop) {
    return {
      lastWeight_kg: last.maxWeight_kg,
      recommendedWeight_kg: increment(last.maxWeight_kg),
      reachedReps: last.repsAtMax,
      targetReps: top,
    }
  }
  return null
}
