import { measurementsApi, type ServerMeasurement } from './measurementsApi'
import { createPendingDeletes, isPending, newPendingId, once } from './pendingSync'

export interface BodyMeasurement {
  id: string
  date: string        // YYYY-MM-DD
  weight_kg?: number
  waist_cm?: number
  chest_cm?: number
  hips_cm?: number
  arm_cm?: number
  thigh_cm?: number
}

const KEY = 'formplan_measurements'
const TOMBSTONE_KEY = 'formplan_measurement_tombstones'
const PENDING_DELETE_KEY = 'formplan_measurement_pending_deletes'

const pendingDeletes = createPendingDeletes(PENDING_DELETE_KEY)

function load(): BodyMeasurement[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as BodyMeasurement[] }
  catch { return [] }
}
function save(data: BodyMeasurement[]) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

// ── Tombstones ───────────────────────────────────────────────────────────────
// Dates whose measurement the user deleted. Without them the server merge in
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

/** A girth row — any girth field set (may also carry weight). */
function isGirthRow(m: ServerMeasurement): boolean {
  return [m.waist_cm, m.chest_cm, m.hips_cm, m.arm_cm, m.thigh_cm].some(
    (v) => typeof v === 'number'
  )
}

export function getMeasurements(): BodyMeasurement[] {
  return load().sort((a, b) => a.date.localeCompare(b.date))
}

export function addMeasurement(m: Omit<BodyMeasurement, 'id'>): BodyMeasurement {
  const all = load()
  // Väntande id tills servern bekräftat. Tidigare ett vanligt uuid plus en
  // POST med .catch(() => {}) — misslyckades den fanns måtten bara i den här
  // webbläsaren, för alltid.
  const entry: BodyMeasurement = { ...m, id: newPendingId() }
  // A new entry for a previously deleted date un-deletes it.
  const tombstones = loadTombstones()
  if (tombstones.delete(m.date)) saveTombstones(tombstones)
  // Replace existing entry for same date
  save([...all.filter((x) => x.date !== m.date), entry])
  // Försök direkt; lyckas det inte ligger posten kvar i kön och flushen tar
  // den. Den lokala upplevelsen väntar aldrig på nätet.
  void pushPending(entry)
  return entry
}

/**
 * Skickar en väntande post och byter dess lokala id mot serverradens.
 *
 * Id-bytet gör flushen idempotent lokalt: posten är inte längre `local-`, så
 * en senare körning hoppar över den.
 */
async function pushPending(entry: BodyMeasurement): Promise<void> {
  const { id, date, ...fields } = entry
  try {
    const { measurement } = await measurementsApi.create({
      measured_on: date,
      ...fields,
      client_id: id,
    })
    // Läs om: listan kan ha ändrats medan anropet pågick.
    const current = load()
    const still = current.find((e) => e.id === id)
    if (!still) return // borttagen eller ersatt under tiden — lämna den i fred
    save([...current.filter((e) => e.id !== id), { ...still, id: measurement.id }])
  } catch {
    /* fortfarande offline / API nere — posten är kvar som väntande */
  }
}

export function deleteMeasurement(id: string) {
  const all = load()
  const entry = all.find((e) => e.id === id)
  save(all.filter((e) => e.id !== id))
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

/** Tar bort serverns omkretsrader för ett datum och kvitterar kön vid lyckat. */
async function pushPendingDelete(date: string): Promise<void> {
  try {
    const { measurements } = await measurementsApi.list()
    const matches = measurements.filter((m) => m.measured_on === date && isGirthRow(m))
    // Alla måste bort innan datumet kvitteras — annars tror vi att det är
    // gjort medan en rad ligger kvar och kommer tillbaka på nästa enhet.
    for (const m of matches) await measurementsApi.remove(m.id)
    pendingDeletes.done(date)
  } catch {
    /* kvar i kön, flushen försöker igen */
  }
}

/**
 * Skickar kroppsmått som loggats eller tagits bort utan nät.
 *
 * Anropas från samma ställen som flushLocalWater/flushLocalSessions.
 */
export const flushLocalMeasurements = once(async () => {
  for (const entry of load().filter((e) => isPending(e.id))) {
    await pushPending(entry)
  }
  for (const date of pendingDeletes.all()) {
    await pushPendingDelete(date)
  }
})

/**
 * Merge server measurement rows (girths logged on other devices) into the
 * local store. Only dates missing locally are added, nothing is overwritten.
 * Locally deleted dates (tombstones) are skipped, and when the server holds
 * several rows for the same date the newest (latest created_at) wins.
 */
export function mergeServerMeasurements(rows: ServerMeasurement[]) {
  // Newest girth row per date.
  const byDate = new Map<string, ServerMeasurement>()
  for (const m of rows) {
    if (!isGirthRow(m)) continue
    const existing = byDate.get(m.measured_on)
    if (!existing || (m.created_at ?? '') > (existing.created_at ?? '')) {
      byDate.set(m.measured_on, m)
    }
  }

  const local = load()
  const tombstones = loadTombstones()
  const have = new Set(local.map((e) => e.date))
  const added: BodyMeasurement[] = []
  for (const m of byDate.values()) {
    if (have.has(m.measured_on) || tombstones.has(m.measured_on)) continue
    have.add(m.measured_on)
    added.push({
      id: m.id,
      date: m.measured_on,
      weight_kg: m.weight_kg ?? undefined,
      waist_cm: m.waist_cm ?? undefined,
      chest_cm: m.chest_cm ?? undefined,
      hips_cm: m.hips_cm ?? undefined,
      arm_cm: m.arm_cm ?? undefined,
      thigh_cm: m.thigh_cm ?? undefined,
    })
  }
  if (added.length > 0) save([...local, ...added])
}
