// Tracks which food-log entries were logged as a whole recipe ("1 portion")
// rather than a gram-based food, so the diary can label them accordingly.
// Stored locally — the macros themselves live on the server; this is only a
// display hint, so it doesn't need to sync.
const KEY = 'formplan_portion_entries'

function load(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function save(ids: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify([...ids]))
}

export function markPortionEntry(id: string) {
  const ids = load()
  ids.add(id)
  save(ids)
}

export function isPortionEntry(id: string): boolean {
  return load().has(id)
}
