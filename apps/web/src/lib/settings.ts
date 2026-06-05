// Persistent app settings backed by localStorage + a React-compatible store.

export interface Reminder {
  id: string
  days: number[]  // 1=Mon … 7=Sun
  time: string    // "HH:MM"
  label: string
  enabled: boolean
}

export interface AppSettings {
  // Utseende
  dark_mode: boolean
  // Träning
  auto_rest: boolean
  rest_seconds_default: number
  keep_screen_on: boolean
  // Kost & hälsa
  calorie_goal: number
  protein_goal_g: number
  water_goal_ml: number
  // Notiser
  notifications_enabled: boolean
  water_reminder: boolean
  // Enheter
  imperial: boolean
  // Reminders
  reminders: Reminder[]
}

const KEY = 'formplan_settings'

const DEFAULTS: AppSettings = {
  dark_mode: false,
  auto_rest: true,
  rest_seconds_default: 60,
  keep_screen_on: true,
  calorie_goal: 2000,
  protein_goal_g: 150,
  water_goal_ml: 2500,
  notifications_enabled: false,
  water_reminder: false,
  imperial: false,
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
