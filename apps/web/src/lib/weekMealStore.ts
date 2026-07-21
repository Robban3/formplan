import type { GeneratedMealPlan, MealCount, DietFocus } from './mealPlanGenerator'

export type WeekSlot = 'frukost' | 'lunch' | 'middag' | 'mellanmar'

// En egen måltid i veckoplanen — antingen AI-uppskattad i veckovyn eller ett
// recept som loggats i kostdagboken.
export interface CustomWeekMeal {
  id: string
  slot: WeekSlot
  name: string
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

export interface DayPlan {
  generated: GeneratedMealPlan | null
  custom: CustomWeekMeal[]
}

export interface WeekMealPlan {
  kcal: number
  mealCount: MealCount
  focus: DietFocus
  days: Record<number, DayPlan> // weekday 1 (Mån) – 7 (Sön)
}

const KEY = 'formplan_meal_week_v2'

function emptyDays(): Record<number, DayPlan> {
  const days: Record<number, DayPlan> = {}
  for (let d = 1; d <= 7; d++) days[d] = { generated: null, custom: [] }
  return days
}

function defaultPlan(): WeekMealPlan {
  return { kcal: 2000, mealCount: 4, focus: 'balanced', days: emptyDays() }
}

export function loadWeekPlan(): WeekMealPlan {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as WeekMealPlan | null
    if (!raw || typeof raw.kcal !== 'number' || !raw.days) return defaultPlan()
    // Säkerställ att alla sju dagar finns (framtidssäkert).
    const days = emptyDays()
    for (let d = 1; d <= 7; d++) {
      if (raw.days[d]) days[d] = { generated: raw.days[d]!.generated ?? null, custom: raw.days[d]!.custom ?? [] }
    }
    // mealCount måste vara en giltig MEAL_CONFIGS-nyckel (3|4|5) — korrupt
    // lagring får inte krascha genereringen.
    const mealCount: MealCount =
      raw.mealCount === 3 || raw.mealCount === 4 || raw.mealCount === 5 ? raw.mealCount : 4
    return { kcal: raw.kcal, mealCount, focus: raw.focus ?? 'balanced', days }
  } catch {
    return defaultPlan()
  }
}

export function saveWeekPlan(plan: WeekMealPlan) {
  localStorage.setItem(KEY, JSON.stringify(plan))
}

// 1 (Mån) – 7 (Sön) för ett datum (sv. veckostart på måndag).
export function weekdayOf(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 7 : d
}

export function dayTotalKcal(day: DayPlan): number {
  // Number(x) || 0 — lagrade måltider kan ha korrupta kcal-värden (NaN/strängar).
  return (
    (Number(day.generated?.totalKcal) || 0) +
    day.custom.reduce((s, m) => s + (Number(m.kcal) || 0), 0)
  )
}

// Lägg till en egen/loggad måltid på en viss veckodag. Används av kostdagboken
// när ett recept loggas, och av veckovyns "Lägg till egen måltid".
export function addCustomWeekMeal(weekday: number, meal: Omit<CustomWeekMeal, 'id'>) {
  const plan = loadWeekPlan()
  const day = plan.days[weekday] ?? { generated: null, custom: [] }
  day.custom = [...day.custom, { ...meal, id: crypto.randomUUID() }]
  plan.days[weekday] = day
  saveWeekPlan(plan)
}
