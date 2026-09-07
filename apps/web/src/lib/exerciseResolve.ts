import { getExerciseById, matchExercise, type CatalogExercise } from './exerciseCatalog'

/**
 * Övningsreferenser i appen kommer från flera håll: AI-genererade scheman,
 * mallpass, egna pass och den aktiva pass-loggen. Vissa av dem bär (eller
 * kommer snart att bära) ett stabilt `exercise_id`, andra bara ett fritextnamn.
 */
export interface ExerciseRef {
  name?: string | null
  /** Från API/scheman. */
  exercise_id?: string | null
  /** Från den lokala pass-loggen (camelCase). */
  exerciseId?: string | null
}

/**
 * Slår upp katalogövningen för en referens: id först (stabilt), därefter en
 * försiktig namnmatchning. Returnerar undefined när inget säkert matchar —
 * anropande UI ska då visa *ingen* bild i stället för fel bild.
 */
export function resolveExercise(
  ref: ExerciseRef | string | null | undefined
): CatalogExercise | undefined {
  if (!ref) return undefined
  if (typeof ref === 'string') return matchExercise(ref)

  const id = ref.exercise_id ?? ref.exerciseId
  if (id) {
    const byId = getExerciseById(id)
    if (byId) return byId
    // Okänt id (t.ex. från ett äldre/annat schema) — fall tillbaka på namnet.
  }
  return ref.name ? matchExercise(ref.name) : undefined
}
