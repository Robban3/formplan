import { getExerciseById } from './exerciseCatalog'
import { resolveExercise, type ExerciseRef } from './exerciseResolve'
import type { ExerciseEntry } from './exerciseHistoryStore'
import type { PersonalRecord } from './prStore'

/**
 * Historik och personbästa lagrades tidigare på övningens *fritextnamn*, vilket
 * gjorde att "Bänkpress" och "Bänkpress med skivstång" hamnade i två separata
 * serier — progressionen såg då aldrig att det var samma lyft. Nyckeln är nu
 * katalogens stabila id när övningen går att slå upp, annars ett normaliserat
 * namn.
 *
 * Uppslagningen delas med bild-/detaljvisningen (`resolveExercise`): id först,
 * därefter namnet. Utan den delade regeln kunde en övning visa bilden för ett
 * id men lagra historik under ett namn som pekade på en annan övning.
 *
 * OBS: typimporterna av lagringsformaten är avsiktligt `import type` — de
 * raderas vid kompilering så att migrationen här kan äga båda formaten utan
 * importcykel.
 */

/** Sätts när engångsmigrationen till id-nycklar är körd. */
const MIGRATION_FLAG = 'formplan_exercise_key_v2'

// Samma nycklar som exerciseHistoryStore/prStore använder. De dupliceras här
// (i stället för att importeras) för att hålla migrationen fri från importcykler.
const HISTORY_STORAGE_KEY = 'formplan_exercise_history'
const PR_STORAGE_KEY = 'formplan_personal_records'

/** Gemensam normalisering: gemener, å/ä→a, ö→o, allt annat blir mellanslag. */
export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Lagringsnyckel för en övning: katalog-id när övningen går att slå upp
 * (`exercise_id`/`exerciseId` först, därefter namnet), annars det normaliserade
 * namnet. Tar samma referensform som `resolveExercise`, så ett schema med id
 * lagrar historik under exakt samma nyckel som bilden visas för.
 */
export function exerciseKey(ref: ExerciseRef | string | null | undefined): string {
  const resolved = resolveExercise(ref)
  if (resolved) return resolved.id
  const name = typeof ref === 'string' ? ref : ref?.name ?? ''
  return normalizeExerciseName(name)
}

/**
 * Slår ihop två historikposter för samma dag: tyngsta vikten vinner (och
 * repsAtMax följer med den vikten), volym och reps summeras.
 */
export function mergeExerciseEntries(prev: ExerciseEntry, next: ExerciseEntry): ExerciseEntry {
  let maxWeight_kg: number
  let repsAtMax: number
  if (next.maxWeight_kg > prev.maxWeight_kg) {
    maxWeight_kg = next.maxWeight_kg
    repsAtMax = next.repsAtMax
  } else if (next.maxWeight_kg < prev.maxWeight_kg) {
    maxWeight_kg = prev.maxWeight_kg
    repsAtMax = prev.repsAtMax
  } else {
    maxWeight_kg = prev.maxWeight_kg
    repsAtMax = Math.max(prev.repsAtMax, next.repsAtMax)
  }
  return {
    date: prev.date,
    maxWeight_kg,
    repsAtMax,
    totalVolume_kg: Math.round((prev.totalVolume_kg + next.totalVolume_kg) * 10) / 10,
    totalReps: prev.totalReps + next.totalReps,
  }
}

/** JSON.parse som aldrig kastar — trasig data behandlas som "inget att migrera". */
function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Nyckeln för en redan migrerad post lämnas orörd. `exerciseKey` skulle ge
 * samma svar (id:t är registrerat som egen nyckel i katalogen), men den här
 * genvägen gör en omkörning bevisligen idempotent även om namnmatchningen
 * ändras i framtiden.
 */
function migratedKey(oldKey: string): string {
  return getExerciseById(oldKey) ? oldKey : exerciseKey(oldKey)
}

function migrateHistory() {
  const parsed = parseJson<Record<string, ExerciseEntry[]>>(
    localStorage.getItem(HISTORY_STORAGE_KEY)
  )
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return

  const out: Record<string, ExerciseEntry[]> = {}
  for (const [oldKey, entries] of Object.entries(parsed)) {
    if (!Array.isArray(entries)) continue
    const key = migratedKey(oldKey)
    const byDate = new Map<string, ExerciseEntry>()
    for (const e of out[key] ?? []) byDate.set(e.date, e)
    for (const entry of entries) {
      if (!entry || typeof entry.date !== 'string') continue
      const prev = byDate.get(entry.date)
      byDate.set(entry.date, prev ? mergeExerciseEntries(prev, entry) : entry)
    }
    out[key] = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
  }
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(out))
}

function migratePersonalRecords() {
  const parsed = parseJson<PersonalRecord[]>(localStorage.getItem(PR_STORAGE_KEY))
  if (!Array.isArray(parsed)) return

  const byKey = new Map<string, PersonalRecord>()
  for (const record of parsed) {
    if (!record || typeof record.exercise !== 'string') continue
    const key = migratedKey(record.exercise)
    const migrated: PersonalRecord = {
      ...record,
      exercise: key,
      // Behåll det tidigare fritextnamnet som visningsnamn.
      name: record.name ?? record.exercise,
    }
    const prev = byKey.get(key)
    // Kolliderar två gamla namn i samma id vinner det tyngsta (est. 1RM).
    if (!prev || migrated.estimated_1rm > prev.estimated_1rm) byKey.set(key, migrated)
  }
  localStorage.setItem(PR_STORAGE_KEY, JSON.stringify([...byKey.values()]))
}

let migrationDone = false

/**
 * Engångsmigration av befintlig localStorage-data till id-nycklar. Anropas
 * lat från både historik- och PR-lagret; flaggan gör att den bara körs en gång.
 */
export function migrateExerciseKeysOnce() {
  if (migrationDone) return
  migrationDone = true
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return

    // Varje steg körs för sig: kastar historikmigreringen får personbästa
    // ändå sin körning. Tidigare delade de ett try, så ett fel i det första
    // steget lämnade PR:n namnnycklade — då hittade checkAndUpdatePR aldrig
    // det gamla rekordet och varje set utropades som nytt personbästa.
    let allOk = true
    for (const step of [migrateHistory, migratePersonalRecords]) {
      try {
        step()
      } catch {
        allOk = false
      }
    }

    // Flaggan sätts bara när BÅDA stegen gick igenom. Misslyckas något körs
    // migreringen om vid nästa start (den är idempotent) i stället för att
    // permanent lämna halvmigrerad data bakom sig.
    if (allOk) localStorage.setItem(MIGRATION_FLAG, '1')
  } catch {
    /* localStorage blockerat — appen fungerar ändå, bara utan migrering. */
  }
}
