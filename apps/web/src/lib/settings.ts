// Persistent app settings backed by localStorage + a React-compatible store.

export interface Reminder {
  id: string
  days: number[]  // 1=Mon … 7=Sun
  time: string    // "HH:MM"
  label: string
  enabled: boolean
}

export interface AppSettings {
  dark_mode: boolean
  imperial: boolean
  auto_rest: boolean
  notifications_enabled: boolean
  reminders: Reminder[]
}

const KEY = 'formplan_settings'

const DEFAULTS: AppSettings = {
  dark_mode: false,
  imperial: false,
  auto_rest: true,
  notifications_enabled: false,
  reminders: [],
}

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(s: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}

// Apply dark mode class to <html> immediately on first import so there's no
// flash of the wrong theme on page load.
let _state = load()
applyDarkMode(_state.dark_mode)

function applyDarkMode(on: boolean) {
  document.documentElement.classList.toggle('dark', on)
}

const _listeners = new Set<() => void>()

export const settingsStore = {
  getSnapshot: (): AppSettings => _state,

  subscribe(listener: () => void) {
    _listeners.add(listener)
    return () => _listeners.delete(listener)
  },

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    _state = { ..._state, [key]: value }
    save(_state)
    if (key === 'dark_mode') applyDarkMode(value as boolean)
    _listeners.forEach((l) => l())
  },

  addReminder(r: Omit<Reminder, 'id'>): Reminder {
    const reminder: Reminder = { ...r, id: crypto.randomUUID() }
    _state = { ..._state, reminders: [..._state.reminders, reminder] }
    save(_state)
    _listeners.forEach((l) => l())
    return reminder
  },

  updateReminder(id: string, patch: Partial<Reminder>) {
    _state = {
      ..._state,
      reminders: _state.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }
    save(_state)
    _listeners.forEach((l) => l())
  },

  deleteReminder(id: string) {
    _state = { ..._state, reminders: _state.reminders.filter((r) => r.id !== id) }
    save(_state)
    _listeners.forEach((l) => l())
  },
}
