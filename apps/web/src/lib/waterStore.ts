import { nutritionApi, type WaterEntry } from './nutritionApi'

const KEY = 'formplan_water_log'

function loadAll(): WaterEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as WaterEntry[]
  } catch {
    return []
  }
}

function saveAll(entries: WaterEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

export function getLocalWater(date: string): { entries: WaterEntry[]; total_ml: number } {
  const entries = loadAll().filter((e) => e.date === date)
  return { entries, total_ml: entries.reduce((s, e) => s + e.amount_ml, 0) }
}

/**
 * Add a local water entry. Pass `pending: true` for entries logged while
 * offline — they get a `local-` id so flushLocalWater() can find and POST them
 * on reconnect. A plain (non-pending) entry is just a mirror of a row already
 * saved on the server and is never re-sent.
 */
export function addLocalWater(date: string, amount_ml: number, pending = false): WaterEntry {
  const entry: WaterEntry = {
    id: pending ? `local-${crypto.randomUUID()}` : crypto.randomUUID(),
    date,
    amount_ml,
    logged_at: new Date().toISOString(),
  }
  saveAll([...loadAll(), entry])
  return entry
}

export function deleteLocalWater(id: string) {
  saveAll(loadAll().filter((e) => e.id !== id))
}

/** Set of dates (YYYY-MM-DD) that have at least one water entry. */
export function getWaterLoggedDays(): Set<string> {
  return new Set(loadAll().map((e) => e.date))
}

export function getLocalWaterSummary(
  from: string,
  to: string
): { days: { date: string; total_ml: number }[] } {
  const map = new Map<string, number>()
  for (const e of loadAll()) {
    if (e.date >= from && e.date <= to) {
      map.set(e.date, (map.get(e.date) ?? 0) + e.amount_ml)
    }
  }
  const days = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total_ml]) => ({ date, total_ml }))
  return { days }
}

// ── Offline flush ─────────────────────────────────────────────────────────────
// Mirrors workoutApi.flushLocalSessions: push water entries logged offline
// (`local-` ids) to the server, then swap the local row for the server row so
// it isn't sent twice. Concurrent callers share one in-flight run.

let flushInFlight: Promise<void> | null = null

async function doFlushLocalWater(): Promise<void> {
  const pending = loadAll().filter((e) => e.id.startsWith('local-'))
  for (const e of pending) {
    try {
      const { entry } = await nutritionApi.addWater(e.date, e.amount_ml)
      // Replace the local- row with the server row (guards against double-send:
      // the entry no longer starts with `local-`, so a later flush skips it).
      saveAll([...loadAll().filter((x) => x.id !== e.id), entry])
    } catch {
      /* still offline / API down — keep the local row and retry later */
    }
  }
}

export function flushLocalWater(): Promise<void> {
  if (!flushInFlight) {
    flushInFlight = doFlushLocalWater().finally(() => {
      flushInFlight = null
    })
  }
  return flushInFlight
}

/**
 * Replace this date's server-mirrored entries with the authoritative server
 * list, so synchronous readers (goalTracker, challenges) match the server.
 * Pending (`local-`) entries for the date are kept — they haven't been flushed
 * yet, so dropping them would lose an offline log.
 */
export function hydrateLocalWater(date: string, serverEntries: WaterEntry[]) {
  const kept = loadAll().filter((e) => e.date !== date || e.id.startsWith('local-'))
  saveAll([...kept, ...serverEntries])
}

/**
 * Seed the local mirror from a server day-total summary so day-scoped readers
 * (e.g. the water-14 challenge's "days with water logged") reflect history from
 * other devices. Only adds a synthetic entry for dates with no local entry, so
 * it can never double-count an existing day.
 */
export function hydrateLocalWaterFromSummary(days: { date: string; total_ml: number }[]) {
  const all = loadAll()
  const haveDates = new Set(all.map((e) => e.date))
  const added: WaterEntry[] = []
  for (const d of days) {
    if (d.total_ml > 0 && !haveDates.has(d.date)) {
      added.push({
        id: crypto.randomUUID(),
        date: d.date,
        amount_ml: d.total_ml,
        logged_at: `${d.date}T12:00:00.000Z`,
      })
    }
  }
  if (added.length > 0) saveAll([...all, ...added])
}
