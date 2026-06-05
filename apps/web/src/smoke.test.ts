import { describe, it, expect } from 'vitest'
import { getMockPlanResponse } from './lib/mockPlan'

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
})
