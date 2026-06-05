import type { LogSessionInput, WorkoutSession } from './workoutApi'
import { sessionsCountThisWeek } from './derive'
import { notifySessionsUpdated, SESSIONS_UPDATED } from './workoutSessionEvents'

const KEY = 'formplan_workout_sessions'
const BACKUP_KEY = 'formplan_workout_sessions_backup'

const listeners = new Set<() => void>()
let memoryCache: WorkoutSession[] = []

function notify() {
  notifySessionsUpdated()
  listeners.forEach((l) => l())
}

function parseSessions(raw: string | null): WorkoutSession[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as WorkoutSession[]) : null
  } catch {
    return null
  }
}

function loadAll(): WorkoutSession[] {
  const sources: { storage: Storage; key: string }[] = [
    { storage: localStorage, key: KEY },
    { storage: localStorage, key: BACKUP_KEY },
    { storage: sessionStorage, key: KEY },
    { storage: sessionStorage, key: BACKUP_KEY },
  ]

  let best: WorkoutSession[] = []
  for (const { storage, key } of sources) {
    try {
      const parsed = parseSessions(storage.getItem(key))
      if (parsed && parsed.length > best.length) best = parsed
    } catch {
      /* storage blocked */
    }
  }

  if (best.length > 0) {
    memoryCache = best
    return best
  }
  return memoryCache
}

function saveAll(sessions: WorkoutSession[]) {
  memoryCache = sessions
  const payload = JSON.stringify(sessions)
  let saved = false
  for (const [storage, key] of [
    [localStorage, KEY],
    [localStorage, BACKUP_KEY],
    [sessionStorage, KEY],
    [sessionStorage, BACKUP_KEY],
  ] as const) {
    try {
      storage.setItem(key, payload)
      saved = true
    } catch {
      /* ignore */
    }
  }
  if (!saved && sessions.length > 0) {
    throw new Error('Kunde inte spara pass lokalt')
  }
}

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function totals(input: LogSessionInput) {
  let totalSets = 0
  let completedSets = 0
  let totalVolume = 0
  for (const ex of input.exercises) {
    for (const s of ex.sets) {
      totalSets++
      if (s.done) {
        completedSets++
        totalVolume += s.reps * (s.weight_kg ?? 0)
      }
    }
  }
  return {
    total_sets: totalSets,
    completed_sets: completedSets,
    total_volume_kg: Math.round(totalVolume * 10) / 10,
  }
}

export function addLocalSession(input: LogSessionInput): WorkoutSession {
  const stats = totals(input)
  const session: WorkoutSession = {
    id: newSessionId(),
    plan_day_id: input.plan_day_id,
    workout_name: input.workout_name,
    started_at: input.started_at,
    completed_at: new Date().toISOString(),
    duration_seconds: input.duration_seconds,
    ...stats,
  }
  saveAll([session, ...loadAll()])
  notify()
  return session
}

export function getLocalSessions(from?: string, to?: string): WorkoutSession[] {
  let sessions = loadAll()
  if (from) sessions = sessions.filter((s) => s.completed_at >= from)
  if (to) sessions = sessions.filter((s) => s.completed_at <= to)
  return sessions.sort((a, b) => b.completed_at.localeCompare(a.completed_at))
}

export function getWeeklySessionCount(): number {
  return sessionsCountThisWeek(getLocalSessions().map((s) => s.completed_at))
}

export function subscribeSessions(listener: () => void): () => void {
  listeners.add(listener)
  listener()

  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === BACKUP_KEY) listener()
  }
  const onEvent = () => listener()

  window.addEventListener('storage', onStorage)
  window.addEventListener(SESSIONS_UPDATED, onEvent)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(SESSIONS_UPDATED, onEvent)
  }
}

export function mergeSessions(api: WorkoutSession[], local: WorkoutSession[]): WorkoutSession[] {
  const byId = new Map<string, WorkoutSession>()
  for (const s of local) byId.set(s.id, s)
  for (const s of api) byId.set(s.id, s)
  return [...byId.values()].sort((a, b) => b.completed_at.localeCompare(a.completed_at))
}
