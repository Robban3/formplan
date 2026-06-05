import { api } from './api'
import { goalFromProfile, loadMockWorkoutPlan, parseMockPlanId } from './mockPlan'

export interface WorkoutPlanDay {
  id: string
  weekday: number
  type: 'workout' | 'rest' | 'nutrition'
  content: {
    name: string
    focus: string
    duration_minutes: number
    exercises: { name: string; sets: number; reps: string; rest_seconds?: number; notes?: string }[]
  }
}

export interface LoadedPlan {
  plan: { id: string; status: string; created_at: string }
  workoutDays: WorkoutPlanDay[]
  isMock: boolean
}

/** SessionStorage (inkl. mock-*) före API-listan — annars försvinner testscheman. */
export async function loadActivePlan(profile?: unknown): Promise<LoadedPlan | null> {
  const stored = sessionStorage.getItem('formplan_plan_id')

  if (stored) {
    const loaded = await tryLoadPlan(stored)
    if (loaded) return loaded
  }

  try {
    const { plans } = await api.listPlans()
    const readyId = plans.find((p) => p.status === 'ready')?.id
    if (readyId) {
      const loaded = await tryLoadPlan(readyId)
      if (loaded) return loaded
    }
  } catch {
    /* listPlans är valfritt */
  }

  if (import.meta.env.DEV) {
    const mock = loadMockWorkoutPlan(goalFromProfile(profile))
    return {
      ...mock,
      workoutDays: mock.workoutDays.filter((d) => d.type === 'workout') as WorkoutPlanDay[],
    }
  }

  return null
}

async function tryLoadPlan(planId: string): Promise<LoadedPlan | null> {
  try {
    const { plan, days } = await api.getPlan(planId)
    const workoutDays = (days as WorkoutPlanDay[]).filter((d) => d.type === 'workout')
    if (workoutDays.length === 0) return null

    sessionStorage.setItem('formplan_plan_id', planId)
    return {
      plan: plan as LoadedPlan['plan'],
      workoutDays,
      isMock: !!parseMockPlanId(planId),
    }
  } catch {
    return null
  }
}