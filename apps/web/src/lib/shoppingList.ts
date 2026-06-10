import { generateMealPlan, type DietFocus, type MealCount } from './mealPlanGenerator'

export interface ShoppingItem {
  name: string
  amount_g: number
}

export interface ShoppingCategory {
  category: string
  items: ShoppingItem[]
}

// Ordered so the categorizer returns the first matching bucket. Keyword match is
// a case-insensitive substring on the food name.
const CATEGORY_RULES: { category: string; match: string[] }[] = [
  { category: 'Nötter & frön', match: ['mandlar', 'valnöt', 'chiafrö'] },
  { category: 'Kött, fisk & ägg', match: ['kyckling', 'nötkött', 'lax', 'bacon', 'korv', 'ägg'] },
  {
    category: 'Mejeri & protein',
    match: ['kvarg', 'yoghurt', 'kesella', 'mjölk', 'fetaost', 'grädde', 'tofu', 'quorn', 'proteinpulver', 'proteinbar'],
  },
  {
    category: 'Skafferi & torrvaror',
    match: ['havre', 'bröd', 'quinoa', 'ris', 'lins', 'kikärt', 'bönmix', 'olivolja', 'choklad', 'hummus', 'jordnötssmör'],
  },
  {
    category: 'Frukt & grönt',
    match: ['banan', 'blåbär', 'bär', 'broccoli', 'tomat', 'äpple', 'spenat', 'sötpotatis', 'vitlök', 'paprika', 'avokado', 'blomkål'],
  },
]

const CATEGORY_ORDER = [
  'Frukt & grönt',
  'Kött, fisk & ägg',
  'Mejeri & protein',
  'Skafferi & torrvaror',
  'Nötter & frön',
  'Övrigt',
]

function categorize(name: string): string {
  const n = name.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.match.some((kw) => n.includes(kw))) return rule.category
  }
  return 'Övrigt'
}

/**
 * Build an aggregated weekly shopping list from the meal-plan generator:
 * generate one day per `days` (varying the seed for variety), sum each food's
 * grams across the week, then group into ordered grocery categories.
 */
export function buildWeeklyShoppingList(
  kcal: number,
  focus: DietFocus,
  mealCount: MealCount,
  days = 7,
  seedOffset = 0
): ShoppingCategory[] {
  const totals = new Map<string, number>()
  for (let d = 0; d < days; d++) {
    const plan = generateMealPlan(kcal, mealCount, focus, d + seedOffset * days)
    for (const meal of plan.meals) {
      for (const food of meal.foods) {
        totals.set(food.name, (totals.get(food.name) ?? 0) + food.amount_g)
      }
    }
  }

  const byCategory = new Map<string, ShoppingItem[]>()
  for (const [name, amount_g] of totals) {
    const category = categorize(name)
    const list = byCategory.get(category) ?? []
    list.push({ name, amount_g: Math.round(amount_g) })
    byCategory.set(category, list)
  }

  return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
    category,
    items: byCategory.get(category)!.sort((a, b) => a.name.localeCompare(b.name, 'sv')),
  }))
}

// ── Checked-off state (persisted locally) ───────────────────────────────────

const KEY = 'formplan_shopping_checked'

export function loadChecked(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function saveChecked(checked: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify([...checked]))
}

/** Display grams as a friendly amount (e.g. 1500 g → "1,5 kg"). */
export function formatAmount(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toLocaleString('sv-SE', { maximumFractionDigits: 1 })} kg`
  return `${grams} g`
}
