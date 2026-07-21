import { measurementsApi, type ServerMeasurement } from './measurementsApi'
import { dateKey } from './derive'

const KEY = 'formplan_weight_log'
const TOMBSTONE_KEY = 'formplan_weight_tombstones'

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

export function addWeightEntry(weight_kg: number): WeightEntry {
  const entries = load()
  // Local date, consistent with the water log — UTC would put entries logged
  // just after midnight on the previous day.
  const date = dateKey()
  // A new entry for a previously deleted date un-deletes it.
  const tombstones = loadTombstones()
  if (tombstones.delete(date)) saveTombstones(tombstones)
  // Replace existing entry for today if any
  const filtered = entries.filter((e) => e.date !== date)
  const entry: WeightEntry = { id: crypto.randomUUID(), date, weight_kg }
  save([...filtered, entry])
  // Best-effort server mirror — the local UX must never depend on it.
  measurementsApi.create({ measured_on: date, weight_kg }).catch(() => {})
  return entry
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
  // …and best-effort delete the matching server rows.
  measurementsApi
    .list()
    .then(({ measurements }) => {
      const matches = measurements.filter((m) => m.measured_on === entry.date && isWeightRow(m))
      return Promise.all(matches.map((m) => measurementsApi.remove(m.id).catch(() => {})))
    })
    .catch(() => {})
}

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
