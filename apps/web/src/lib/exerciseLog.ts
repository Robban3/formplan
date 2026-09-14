import { resolveExercise, type ExerciseRef } from './exerciseResolve'

// Fritextfallback: konditionsövningar som loggas med tid/distans. Nyckelorden är
// valda för att INTE krocka med styrkenamn (t.ex. "Hantelrodd", "Utfallsgång").
//
// Gissningen används bara när övningen inte går att slå upp i katalogen. Den är
// ordagrant otillförlitlig: "Cykelcrunch" innehåller "cykl" och klassades som
// kondition (magövningen fick fält för tid och distans, reps loggades aldrig),
// medan "Gång" och "Battle ropes" inte innehåller något konditionsord alls och
// fick ett viktfält. Katalogens `logStyle` avgör därför först.
const CARDIO_RE =
  /löp|jogg|cykl|cykel|spinning|roddmaskin|stairmaster|trappmaskin|crosstrainer|elliptical|hopprep|skipping|simning|simma|promenad|fartlek|airbike|kondition/i

const BODYWEIGHT_RE =
  /burpee|plank|mountain climber|push-up|pushup|crunch|dead bug|russian twist|bicycle|löp|lop|promenad|stretch|mobilitet|uppvärm|nedvarv|fartlek|tempo|intervall|cykel|cykling|jogging|walking|löpband/i

/** Sant om övningen är kondition och loggas med tid/distans. */
export function isCardioExercise(exercise: ExerciseRef | string): boolean {
  const catalog = resolveExercise(exercise)
  if (catalog) return catalog.logStyle === 'time'
  const name = typeof exercise === 'string' ? exercise : exercise.name ?? ''
  return CARDIO_RE.test(name.toLowerCase())
}

/** Sant om övningen normalt loggas med extern vikt (hantlar, skivstång m.m.). */
export function exerciseUsesWeight(
  exercise: ExerciseRef | string,
  targetReps?: string
): boolean {
  // Ett mål angivet i tid ("30 s", "max") är aldrig ett viktsatt set — det
  // gäller även för en katalogövning som annars loggas med vikt.
  if (targetReps && /\d\s*(s|sek|min)\b|^max$/i.test(targetReps.trim())) return false

  const catalog = resolveExercise(exercise)
  if (catalog) return catalog.logStyle === 'reps'

  const n = (typeof exercise === 'string' ? exercise : exercise.name ?? '').toLowerCase()
  if (CARDIO_RE.test(n)) return false
  return !BODYWEIGHT_RE.test(n)
}
