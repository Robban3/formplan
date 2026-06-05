import type { DailyGoals, NutritionDay } from './types'

// ISO weekday for a YYYY-MM-DD date string: 1 = Monday … 7 = Sunday.
// Parsed as UTC so the result is independent of the server timezone.
export function isoWeekday(dateStr: string): number {
  const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay()
  return day === 0 ? 7 : day
}

// Sensible macro split when the user has no plan-derived nutrition target.
// 30% protein / 25% fat / 45% carbs of the calorie goal.
export function defaultGoals(calorieGoal: number | null | undefined): DailyGoals {
  const kcal = calorieGoal && calorieGoal > 0 ? calorieGoal : 2000
  return {
    kcal,
    protein_g: Math.round((kcal * 0.3) / 4),
    fat_g: Math.round((kcal * 0.25) / 9),
    carbs_g: Math.round((kcal * 0.45) / 4),
  }
}

// Convert a plan's nutrition day into daily goals.
export function goalsFromNutritionDay(n: NutritionDay): DailyGoals {
  return {
    kcal: Math.round(n.total_calories),
    protein_g: Math.round(n.protein_g),
    fat_g: Math.round(n.fat_g),
    carbs_g: Math.round(n.carbs_g),
  }
}
