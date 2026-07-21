import { dateKey } from './derive'

const KEY = 'formplan_rpe_log'

// `ts` is the logging instant (ms). It keeps multiple same-day ratings ordered
// and distinct; older entries saved before this field are treated as ts 0.
export interface RpeEntry { date: string; rpe: number; workoutName: string; ts?: number }

function load(): RpeEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as RpeEntry[] }
  catch { return [] }
}

export function saveRpe(workoutName: string, rpe: number) {
  const all = load()
  const now = new Date()
  // One entry per finished workout session — a second workout the same day
  // keeps its own rating instead of overwriting the first.
  localStorage.setItem(
    KEY,
    JSON.stringify([...all, { date: dateKey(now), rpe, workoutName, ts: now.getTime() }])
  )
}

export function getRpeEntries(): RpeEntry[] {
  return load().sort((a, b) => a.date.localeCompare(b.date) || (a.ts ?? 0) - (b.ts ?? 0))
}
