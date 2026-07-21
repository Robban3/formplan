import { request } from './api'
import { parseMockPlanId } from './mockPlan'
import {
  addLocalSession,
  getLocalSessions,
  mergeSessions,
  replaceLocalSession,
} from './workoutSessionStore'
import { notifyWorkoutLogged } from './challengeEvents'

export interface SessionSetInput {
  reps: number
  weight_kg: number | null
  done: boolean
  duration_min?: number | null
  distance_km?: number | null
}

export interface SessionExerciseInput {
  name: string
  sets: SessionSetInput[]
}

export interface LogSessionInput {
  plan_day_id: string | null
  workout_name: string
  started_at: string // ISO
  /** ISO — when set, the server keeps this instead of stamping "now" (needed for offline flush). */
  completed_at?: string
  duration_seconds: number
  exercises: SessionExerciseInput[]
}

export interface WorkoutSession {
  id: string
  plan_day_id: string | null
  workout_name: string
  started_at: string
  completed_at: string
  duration_seconds: number
  total_sets: number
  completed_sets: number
  total_volume_kg: number
  /** Present on server rows and on locally logged sessions (needed for offline flush). */
  exercises?: SessionExerciseInput[]
}

// The API validates plan_day_id as a UUID. Anything else (mock-…, custom-…,
// template-… ids) must be sent as null or the POST is rejected with a 400 and
// the offline flush retries forever.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function apiPlanDayId(planDayId: string | null): string | null {
  if (!planDayId) return null
  if (parseMockPlanId(planDayId)) return null
  return UUID_RE.test(planDayId) ? planDayId : null
}

async function postSession(input: LogSessionInput): Promise<WorkoutSession> {
  const { session } = await request<{ session: WorkoutSession }>('/workout/session', {
    method: 'POST',
    body: JSON.stringify({ ...input, plan_day_id: apiPlanDayId(input.plan_day_id) }),
  })
  return session
}

async function doFlushLocalSessions(): Promise<void> {
  const pending = getLocalSessions().filter(
    (s) => s.id.startsWith('local-') && Array.isArray(s.exercises)
  )
  for (const s of pending) {
    try {
      const session = await postSession({
        plan_day_id: s.plan_day_id,
        workout_name: s.workout_name,
        started_at: s.started_at,
        // Preserve the true completion time — the server would otherwise stamp
        // "now", shifting streaks/weekly counts for offline-logged sessions.
        completed_at: s.completed_at,
        duration_seconds: s.duration_seconds,
        exercises: s.exercises!,
      })
      replaceLocalSession(s.id, session)
    } catch {
      /* still offline / API down — keep the local row and retry later */
    }
  }
}

// Concurrent callers (e.g. React StrictMode double-effects) share one run so
// the same local session is never POSTed twice in parallel.
let flushInFlight: Promise<void> | null = null

export const workoutApi = {
  logSession: async (input: LogSessionInput) => {
    // Single owner of the local write: exactly one local insert per finished workout.
    const local = addLocalSession(input)
    notifyWorkoutLogged()
    try {
      const session = await postSession({ ...input, completed_at: local.completed_at })
      // Reconcile: swap the optimistic local- row for the server row.
      replaceLocalSession(local.id, session)
      return { session }
    } catch {
      return { session: local }
    }
  },

  /**
   * Push sessions that were logged offline (id `local-…`) to the API and
   * replace them with the server rows. Failures are ignored silently — the
   * rows stay local and are retried on next app start.
   */
  flushLocalSessions: (): Promise<void> => {
    if (!flushInFlight) {
      flushInFlight = doFlushLocalSessions().finally(() => {
        flushInFlight = null
      })
    }
    return flushInFlight
  },

  getSessions: async (from?: string, to?: string) => {
    const local = getLocalSessions(from, to)
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const qs = params.toString()
      const { sessions } = await request<{ sessions: WorkoutSession[] }>(
        `/workout/sessions${qs ? `?${qs}` : ''}`
      )
      return { sessions: mergeSessions(sessions ?? [], local) }
    } catch {
      return { sessions: local }
    }
  },

  getExerciseHistory: async (name: string) => {
    try {
      return await request<{
        history: { date: string; sets: { reps: number; weight_kg: number | null }[] }[]
      }>(`/workout/exercise-history?name=${encodeURIComponent(name)}`)
    } catch {
      return { history: [] }
    }
  },
}
