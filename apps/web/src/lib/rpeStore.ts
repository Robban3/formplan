const KEY = 'formplan_rpe_log'

export interface RpeEntry { date: string; rpe: number; workoutName: string }

function load(): RpeEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as RpeEntry[] }
  catch { return [] }
}

export function saveRpe(workoutName: string, rpe: number) {
  const all = load()
  const date = new Date().toISOString().slice(0, 10)
  const filtered = all.filter((e) => e.date !== date) // one per day
  localStorage.setItem(KEY, JSON.stringify([...filtered, { date, rpe, workoutName }]))
}

export function getRpeEntries(): RpeEntry[] {
  return load().sort((a, b) => a.date.localeCompare(b.date))
}
