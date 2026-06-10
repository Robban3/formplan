// Cardio/conditioning exercises — logged with time/distance, not reps/weight.
// Keywords chosen to avoid colliding with strength names (e.g. "Hantelrodd",
// "Utfallsgång") so those stay weight/reps exercises.
const CARDIO_RE =
  /löp|jogg|cykl|cykel|spinning|roddmaskin|stairmaster|trappmaskin|crosstrainer|elliptical|hopprep|skipping|simning|simma|promenad|fartlek|airbike|kondition/i

/** Sant om övningen är kondition och loggas med tid/distans. */
export function isCardioExercise(name: string): boolean {
  return CARDIO_RE.test(name.toLowerCase())
}

/** Sant om övningen normalt loggas med extern vikt (hantlar, skivstång m.m.). */
export function exerciseUsesWeight(name: string, targetReps?: string): boolean {
  if (targetReps && /\d\s*(s|sek|min)\b|^max$/i.test(targetReps.trim())) return false

  const n = name.toLowerCase()
  if (isCardioExercise(n)) return false
  if (
    /burpee|plank|mountain climber|push-up|pushup|crunch|dead bug|russian twist|bicycle|löp|lop|promenad|stretch|mobilitet|uppvärm|nedvarv|fartlek|tempo|intervall|cykel|cykling|jogging|walking|löpband/i.test(
      n
    )
  ) {
    return false
  }

  return true
}
