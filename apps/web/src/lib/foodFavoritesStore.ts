const KEY = 'formplan_food_favorites'

export interface FoodFavorite {
  food_id: string
  food_name: string
  default_amount_g: number
  kcal_per_100g: number
  protein_per_100g: number
  fat_per_100g: number
  carbs_per_100g: number
  count: number
  last_used: string
}

function load(): FoodFavorite[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as FoodFavorite[] }
  catch { return [] }
}

function save(f: FoodFavorite[]) {
  localStorage.setItem(KEY, JSON.stringify(f))
}

export function getTopFavorites(limit = 6): FoodFavorite[] {
  return load().sort((a, b) => b.count - a.count).slice(0, limit)
}

export function recordFoodUsed(f: Omit<FoodFavorite, 'count' | 'last_used'>) {
  const all = load()
  const existing = all.find((x) => x.food_id === f.food_id)
  if (existing) {
    // Refresh nutrition/amount first, then bump count so it can't be clobbered.
    Object.assign(existing, f)
    existing.count += 1
    existing.last_used = new Date().toISOString()
  } else {
    all.push({ ...f, count: 1, last_used: new Date().toISOString() })
  }
  save(all)
}
