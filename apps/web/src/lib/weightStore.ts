import { measurementsApi, type ServerMeasurement } from './measurementsApi'
import { getMeasurements } from './measurementStore'
import { dateKey } from './derive'
import { createPendingDeletes, isPending, newPendingId, once } from './pendingSync'

const KEY = 'formplan_weight_log'
const TOMBSTONE_KEY = 'formplan_weight_tombstones'
const WEIGHT_FROM_MEASUREMENTS_FLAG = 'formplan_weight_from_measurements_v1'
const PENDING_DELETE_KEY = 'formplan_weight_pending_deletes'

const pendingDeletes = createPendingDeletes(PENDING_DELETE_KEY)

export interface WeightEntry {
  id: string
  date: string       // YYYY-MM-DD
  weight_kg: number
}

function load(): WeightEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as WeightEntry[]
  } catch {
    return []
  }
}

function save(entries: WeightEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

// ── Tombstones ───────────────────────────────────────────────────────────────
// Dates whose weight entry the user deleted. Without them the server merge in
// initMeasurementsSync would resurrect deleted entries on next launch.

function loadTombstones(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(TOMBSTONE_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function saveTombstones(dates: Set<string>) {
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify([...dates]))
}

/** A pure weight row (no girth fields) — the kind addWeightEntry creates. */
function isWeightRow(m: ServerMeasurement): boolean {
  return (
    typeof m.weight_kg === 'number' &&
    ![m.waist_cm, m.chest_cm, m.hips_cm, m.arm_cm, m.thigh_cm].some((v) => typeof v === 'number')
  )
}

export function getWeightEntries(): WeightEntry[] {
  return load().sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * One-time local migration (no network) for legacy users whose weight was only
 * ever stored on girth rows in `measurementStore` (before weight moved to its
 * own store). Copies each such `weight_kg` into weightStore so it shows in the
 * Measurements trend/history immediately, without waiting for a server
 * round-trip. Existing weight entries and locally deleted dates (tombstones)
 * are respected, so it never overwrites or resurrects anything. Idempotent via
 * a persisted flag.
 */
export function migrateWeightFromMeasurements(): void {
  try {
    if (localStorage.getItem(WEIGHT_FROM_MEASUREMENTS_FLAG)) return
    const measurements = getMeasurements()
    // Don't set the flag while measurementStore is still empty (e.g. a fresh
    // device before the server sync populates it) — otherwise the flag would be
    // set with nothing migrated, and legacy combined weight+girth rows that
    // arrive later via the sync would never reach weightStore. We re-run this
    // after initMeasurementsSync() resolves.
    if (measurements.length === 0) return
    const entries = load()
    const tombstones = loadTombstones()
    const have = new Set(entries.map((e) => e.date))
    const added: WeightEntry[] = []
    for (const m of measurements) {
      if (typeof m.weight_kg !== 'number') continue
      if (have.has(m.date) || tombstones.has(m.date)) continue
      have.add(m.date)
      added.push({ id: crypto.randomUUID(), date: m.date, weight_kg: m.weight_kg })
    }
    if (added.length > 0) save([...entries, ...added])
    localStorage.setItem(WEIGHT_FROM_MEASUREMENTS_FLAG, '1')
  } catch {
    /* storage blocked — retry on next launch */
  }
}

export function addWeightEntry(weight_kg: number): WeightEntry {
  const entries = load()
  // Local date, consistent with the water log — UTC would put entries logged
  // just after midnight on the previous day.
  const date = dateKey()
  // A new entry for a previously deleted date un-deletes it.
  const tombstones = loadTombstones()
  if (tombstones.delete(date)) saveTombstones(tombstones)
  // En ny post för datumet ersätter den gamla. Fanns där en VÄNTANDE post är
  // den borta nu, och dess client_id med den — det är avsiktligt: det är det
  // nya värdet som ska nå servern, inte det överskrivna.
  const filtered = entries.filter((e) => e.date !== date)
  // Väntande id tills servern bekräftat. Tidigare fick posten ett vanligt
  // uuid och POSTen gjordes med .catch(() => {}) — misslyckades den fanns
  // vikten bara i den här webbläsaren, för alltid.
  const entry: WeightEntry = { id: newPendingId(), date, weight_kg }
  save([...filtered, entry])
  // Försök direkt; lyckas det inte ligger posten kvar i kön och flushen tar
  // den. Den lokala upplevelsen väntar aldrig på nätet.
  void pushPending(entry)
  return entry
}

/**
 * Skickar en väntande post och byter dess lokala id mot serverradens.
 *
 * Id-bytet är det som gör flushen idempotent lokalt: posten är inte längre
 * `local-`, så en senare körning hoppar över den.
 */
async function pushPending(entry: WeightEntry): Promise<void> {
  try {
    const { measurement } = await measurementsApi.create({
      measured_on: entry.date,
      weight_kg: entry.weight_kg,
      client_id: entry.id,
    })
    // Läs om: listan kan ha ändrats medan anropet pågick.
    const current = load()
    const still = current.find((e) => e.id === entry.id)
    if (!still) return // borttagen eller ersatt under tiden — lämna den i fred
    save([...current.filter((e) => e.id !== entry.id), { ...still, id: measurement.id }])
  } catch {
    /* fortfarande offline / API nere — posten är kvar som väntande */
  }
}

export function deleteWeightEntry(id: string) {
  const entries = load()
  const entry = entries.find((e) => e.id === id)
  save(entries.filter((e) => e.id !== id))
  if (!entry) return
  // Tombstone the date so the next server merge doesn't resurrect it…
  const tombstones = loadTombstones()
  tombstones.add(entry.date)
  saveTombstones(tombstones)
  // En post som aldrig nådde servern behöver ingen serverborttagning.
  if (isPending(entry.id)) return
  // …och köa serverborttagningen. Den gjordes tidigare fire-and-forget, så en
  // borttagning offline fastnade lokalt: raden låg kvar på servern och kom
  // tillbaka på nästa enhet användaren loggade in på.
  pendingDeletes.add(entry.date)
  void pushPendingDelete(entry.date)
}

/** Tar bort serverns viktrader för ett datum och kvitterar kön vid lyckat. */
async function pushPendingDelete(date: string): Promise<void> {
  try {
    const { measurements } = await measurementsApi.list()
    const matches = measurements.filter((m) => m.measured_on === date && isWeightRow(m))
    // Alla måste bort innan datumet kvitteras — annars tror vi att det är
    // gjort medan en rad ligger kvar och kommer tillbaka på nästa enhet.
    for (const m of matches) await measurementsApi.remove(m.id)
    pendingDeletes.done(date)
  } catch {
    /* kvar i kön, flushen försöker igen */
  }
}

/**
 * Skickar vikt som loggats eller tagits bort utan nät.
 *
 * Anropas från samma ställen som flushLocalWater/flushLocalSessions.
 */
export const flushLocalWeights = once(async () => {
  for (const entry of load().filter((e) => isPending(e.id))) {
    await pushPending(entry)
  }
  for (const date of pendingDeletes.all()) {
    await pushPendingDelete(date)
  }
})

/**
 * Merge server weight rows (from other devices / earlier backfills) into the
 * local log. Local entries are the on-device source of truth: only dates
 * missing locally are added, nothing is overwritten. Locally deleted dates
 * (tombstones) are skipped, and when the server holds several rows for the
 * same date the newest (latest created_at) wins.
 */
export function mergeServerWeights(rows: ServerMeasurement[]) {
  // Newest row per date.
  const byDate = new Map<string, ServerMeasurement>()
  for (const m of rows) {
    if (typeof m.weight_kg !== 'number') continue
    const existing = byDate.get(m.measured_on)
    if (!existing || (m.created_at ?? '') > (existing.created_at ?? '')) {
      byDate.set(m.measured_on, m)
    }
  }

  const local = load()
  const tombstones = loadTombstones()
  const have = new Set(local.map((e) => e.date))
  const added: WeightEntry[] = []
  for (const m of byDate.values()) {
    if (have.has(m.measured_on) || tombstones.has(m.measured_on)) continue
    have.add(m.measured_on)
    added.push({ id: m.id, date: m.measured_on, weight_kg: m.weight_kg! })
  }
  if (added.length > 0) save([...local, ...added])
}
