import { request } from './api'

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

export const workoutApi = {
  logSession: (input: LogSessionInput) =>
    request<{ session: WorkoutSession }>('/workout/session', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getSessions: (from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const qs = params.toString()
    return request<{ sessions: WorkoutSession[] }>(`/workout/sessions${qs ? `?${qs}` : ''}`)
  },

  getExerciseHistory: (name: string) =>
    request<{
      history: { date: string; sets: { reps: number; weight_kg: number | null }[] }[]
    }>(`/workout/exercise-history?name=${encodeURIComponent(name)}`),
}
