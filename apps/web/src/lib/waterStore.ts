import type { WaterEntry } from './nutritionApi'

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

export function addLocalWater(date: string, amount_ml: number): WaterEntry {
  const entry: WaterEntry = {
    id: crypto.randomUUID(),
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
