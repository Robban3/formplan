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
  const date = new Date().toISOString().slice(0, 10)
  // Replace existing entry for today if any
  const filtered = entries.filter((e) => e.date !== date)
  const entry: WeightEntry = { id: crypto.randomUUID(), date, weight_kg }
  save([...filtered, entry])
  return entry
}

export function deleteWeightEntry(id: string) {
  save(load().filter((e) => e.id !== id))
}
