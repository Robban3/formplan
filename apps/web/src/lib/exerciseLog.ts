/** Sant om övningen normalt loggas med extern vikt (hantlar, skivstång m.m.). */
export function exerciseUsesWeight(name: string, targetReps?: string): boolean {
  if (targetReps && /\d\s*(s|sek|min)\b|^max$/i.test(targetReps.trim())) return false

  const n = name.toLowerCase()
  if (
    /burpee|plank|mountain climber|push-up|pushup|crunch|dead bug|russian twist|bicycle|löp|lop|promenad|stretch|mobilitet|uppvärm|nedvarv|fartlek|tempo|intervall|cykel|cykling|jogging|walking|löpband/i.test(
      n
    )
  ) {
    return false
  }

  return true
}
