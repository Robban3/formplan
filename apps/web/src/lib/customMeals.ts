export interface MealIngredient {
  food_id?: string
  food_name: string
  amount_g: number
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

export interface CustomMeal {
  id: string
  name: string
  ingredients: MealIngredient[]
  createdAt: string
}

const KEY = 'formplan_custom_meals'

export function loadCustomMeals(): CustomMeal[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CustomMeal[]
  } catch {
    return []
  }
}

export function saveCustomMeal(meal: CustomMeal) {
  const all = loadCustomMeals()
  const idx = all.findIndex((m) => m.id === meal.id)
  if (idx >= 0) all[idx] = meal
  else all.push(meal)
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function deleteCustomMeal(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadCustomMeals().filter((m) => m.id !== id)))
}

export function mealTotals(ingredients: MealIngredient[]) {
  return ingredients.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      protein_g: acc.protein_g + i.protein_g,
      fat_g: acc.fat_g + i.fat_g,
      carbs_g: acc.carbs_g + i.carbs_g,
    }),
    { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 }
  )
}
