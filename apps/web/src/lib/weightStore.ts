import { measurementsApi, type ServerMeasurement } from './measurementsApi'
import { dateKey } from './derive'

const KEY = 'formplan_weight_log'

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

export function getWeightEntries(): WeightEntry[] {
  return load().sort((a, b) => a.date.localeCompare(b.date))
}

export function addWeightEntry(weight_kg: number): WeightEntry {
  const entries = load()
  // Local date, consistent with the water log — UTC would put entries logged
  // just after midnight on the previous day.
  const date = dateKey()
  // Replace existing entry for today if any
  const filtered = entries.filter((e) => e.date !== date)
  const entry: WeightEntry = { id: crypto.randomUUID(), date, weight_kg }
  save([...filtered, entry])
  // Best-effort server mirror — the local UX must never depend on it.
  measurementsApi.create({ measured_on: date, weight_kg }).catch(() => {})
  return entry
}

export function deleteWeightEntry(id: string) {
  save(load().filter((e) => e.id !== id))
}

/**
 * Merge server weight rows (from other devices / earlier backfills) into the
 * local log. Local entries are the on-device source of truth: only dates
 * missing locally are added, nothing is overwritten.
 */
export function mergeServerWeights(rows: ServerMeasurement[]) {
  const local = load()
  const have = new Set(local.map((e) => e.date))
  const added: WeightEntry[] = []
  for (const m of rows) {
    if (typeof m.weight_kg !== 'number' || have.has(m.measured_on)) continue
    have.add(m.measured_on)
    added.push({ id: m.id, date: m.measured_on, weight_kg: m.weight_kg })
  }
  if (added.length > 0) save([...local, ...added])
}
