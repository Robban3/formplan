import { describe, it, expect } from 'vitest'
import { isoWeekday, defaultGoals, goalsFromNutritionDay } from './derive'

describe('isoWeekday', () => {
  it('maps Monday to 1 and Sunday to 7', () => {
    expect(isoWeekday('2024-01-01')).toBe(1) // Monday
    expect(isoWeekday('2024-01-07')).toBe(7) // Sunday
    expect(isoWeekday('2024-01-03')).toBe(3) // Wednesday
  })
})

describe('defaultGoals', () => {
  it('uses the provided calorie goal', () => {
    const g = defaultGoals(2400)
    expect(g.kcal).toBe(2400)
    expect(g.protein_g).toBe(Math.round((2400 * 0.3) / 4))
    expect(g.fat_g).toBe(Math.round((2400 * 0.25) / 9))
    expect(g.carbs_g).toBe(Math.round((2400 * 0.45) / 4))
  })

  it('falls back to 2000 kcal for null/zero', () => {
    expect(defaultGoals(null).kcal).toBe(2000)
    expect(defaultGoals(0).kcal).toBe(2000)
    expect(defaultGoals(undefined).kcal).toBe(2000)
  })
})

describe('goalsFromNutritionDay', () => {
  it('rounds macro values from a nutrition day', () => {
    const g = goalsFromNutritionDay({
      total_calories: 1999.6,
      protein_g: 150.4,
      carbs_g: 200.5,
      fat_g: 60.2,
      meals: [],
    })
    expect(g).toEqual({ kcal: 2000, protein_g: 150, fat_g: 60, carbs_g: 201 })
  })
})
