import type { LogSessionInput, WorkoutSession } from './workoutApi'
import { dateKey, sessionsCountThisWeek } from './derive'
import { notifySessionsUpdated, SESSIONS_UPDATED } from './workoutSessionEvents'
import { recordExerciseSession } from './exerciseHistoryStore'

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
    // Keep the raw exercises so an offline session can be POSTed to the API later.
    exercises: input.exercises,
  }
  saveAll([session, ...loadAll()])

  // Store per-exercise history for progression charts (local day key)
  const date = dateKey(new Date(session.completed_at))
  for (const ex of input.exercises) {
    recordExerciseSession(ex.name, date, ex.sets)
  }

  notify()
  return session
}

export function getLocalSessions(from?: string, to?: string): WorkoutSession[] {
  let sessions = loadAll()
  // A date-only bound (YYYY-MM-DD) must be compared against the session's
  // date part — comparing it lexically against a full ISO timestamp would
  // e.g. exclude sessions completed later the same day for `to` bounds.
  if (from) {
    sessions = sessions.filter((s) =>
      from.length === 10 ? s.completed_at.slice(0, 10) >= from : s.completed_at >= from
    )
  }
  if (to) {
    sessions = sessions.filter((s) =>
      to.length === 10 ? s.completed_at.slice(0, 10) <= to : s.completed_at <= to
    )
  }
  return sessions.sort((a, b) => b.completed_at.localeCompare(a.completed_at))
}

/**
 * Replace an optimistic `local-<uuid>` row with the server-created row after a
 * successful POST, so the same workout never exists under two ids.
 */
export function replaceLocalSession(localId: string, serverSession: WorkoutSession) {
  const rest = loadAll().filter((s) => s.id !== localId && s.id !== serverSession.id)
  saveAll(
    [serverSession, ...rest].sort((a, b) => b.completed_at.localeCompare(a.completed_at))
  )
  notify()
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

/** Sessions with identical started_at + workout_name are the same session. */
function contentKey(s: WorkoutSession): string {
  // Normalize via epoch time — the server may return the same instant in a
  // different ISO format (e.g. `+00:00` instead of `Z`).
  const t = new Date(s.started_at).getTime()
  return `${Number.isNaN(t) ? s.started_at : t}|${s.workout_name}`
}

/** Collapse duplicates that share started_at + workout_name, preferring server ids. */
function dedupeByContent(sessions: WorkoutSession[]): WorkoutSession[] {
  const byContent = new Map<string, WorkoutSession>()
  for (const s of sessions) {
    const key = contentKey(s)
    const existing = byContent.get(key)
    if (!existing || (existing.id.startsWith('local-') && !s.id.startsWith('local-'))) {
      byContent.set(key, s)
    }
  }
  return [...byContent.values()]
}

export function mergeSessions(api: WorkoutSession[], local: WorkoutSession[]): WorkoutSession[] {
  const byId = new Map<string, WorkoutSession>()
  for (const s of local) byId.set(s.id, s)
  for (const s of api) byId.set(s.id, s)
  // Safety net: a local- row that was also persisted server-side (e.g. the
  // response was lost) must not show up twice — prefer the server copy.
  return dedupeByContent([...byId.values()]).sort((a, b) =>
    b.completed_at.localeCompare(a.completed_at)
  )
}

/** Merge API sessions into the local store and notify all subscribers. */
export function syncSessionsFromApi(apiSessions: WorkoutSession[]) {
  const merged = mergeSessions(apiSessions, loadAll())
  saveAll(merged)
  notify()
}

// ── One-time dedup ────────────────────────────────────────────────────────────
// A double-insert bug (local write in both ActiveWorkout and logSession)
// shipped and left duplicate rows in existing users' stores. Collapse them
// once; the flag prevents re-running.
const DEDUP_FLAG = 'formplan_sessions_dedup_v1'

function dedupExistingSessionsOnce() {
  try {
    if (localStorage.getItem(DEDUP_FLAG) === '1') return
    const all = loadAll()
    const deduped = dedupeByContent(all)
    if (deduped.length !== all.length) {
      saveAll(deduped.sort((a, b) => b.completed_at.localeCompare(a.completed_at)))
      notify()
    }
    localStorage.setItem(DEDUP_FLAG, '1')
  } catch {
    /* storage unavailable (e.g. non-browser env) — skip */
  }
}

dedupExistingSessionsOnce()
