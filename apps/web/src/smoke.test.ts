import { describe, it, expect } from 'vitest'
import { MOCK_GOALS, getMockPlanResponse, mockPlanId } from './lib/mockPlan'
import { getExerciseById } from './lib/exerciseCatalog'
import { resolveExercise } from './lib/exerciseResolve'

describe('smoke: critical modules', () => {
  it('loads mock plan without init crash', () => {
    const { plan, days } = getMockPlanResponse('mock-lose_weight', 'lose_weight')
    expect(plan.status).toBe('ready')
    expect(days.some((d) => d.type === 'workout')).toBe(true)
    expect(days.some((d) => d.type === 'nutrition')).toBe(true)
  })

  it('loadMockWorkoutPlan returns 4 workout days for lose_weight', () => {
    const { days, plan } = getMockPlanResponse('mock-lose_weight', 'lose_weight')
    const loaded = {
      plan,
      workoutDays: days.filter((d) => d.type === 'workout'),
      isMock: true as const,
    }
    expect(loaded.isMock).toBe(true)
    expect(loaded.workoutDays).toHaveLength(4)
    expect(loaded.workoutDays[0]?.content).toHaveProperty('exercises')
  })

  // api.getPlan serves the mock for every `mock-*` id in every build, so a
  // free-text name here would ship the wrong exercise photo to real users.
  it('locks every mock exercise to the catalog', () => {
    for (const goal of MOCK_GOALS) {
      const { days } = getMockPlanResponse(mockPlanId(goal), goal)
      const workouts = days.filter((d) => d.type === 'workout')
      expect(workouts.length, `${goal} saknar pass`).toBeGreaterThan(0)
      for (const day of workouts) {
        const { exercises } = day.content as { exercises: { name: string; exercise_id: string }[] }
        for (const ex of exercises) {
          const catalog = getExerciseById(ex.exercise_id)
          expect(catalog, `${goal}: okänt exercise_id "${ex.exercise_id}"`).toBeDefined()
          // Kanoniskt namn — och samma övning som UI:t skulle lösa upp.
          expect(ex.name).toBe(catalog!.name)
          expect(resolveExercise(ex)?.id).toBe(ex.exercise_id)
        }
      }
    }
  })
})
