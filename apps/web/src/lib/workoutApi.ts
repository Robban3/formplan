import { request } from './api'
import { parseMockPlanId } from './mockPlan'
import { addLocalSession, getLocalSessions, mergeSessions } from './workoutSessionStore'

export interface SessionSetInput {
  reps: number
  weight_kg: number | null
  done: boolean
}

export interface SessionExerciseInput {
  name: string
  sets: SessionSetInput[]
}

export interface LogSessionInput {
  plan_day_id: string | null
  workout_name: string
  started_at: string // ISO
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
}

function apiPlanDayId(planDayId: string | null): string | null {
  if (!planDayId) return null
  if (parseMockPlanId(planDayId) || planDayId.startsWith('mock-')) return null
  return planDayId
}

export const workoutApi = {
  logSession: async (input: LogSessionInput) => {
    const local = addLocalSession(input)
    try {
      const { session } = await request<{ session: WorkoutSession }>('/workout/session', {
        method: 'POST',
        body: JSON.stringify({ ...input, plan_day_id: apiPlanDayId(input.plan_day_id) }),
      })
      return { session }
    } catch {
      return { session: local }
    }
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
