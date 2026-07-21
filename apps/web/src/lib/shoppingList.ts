import { generateMealPlan, type DietFocus, type MealCount } from './mealPlanGenerator'
import type { WeekMealPlan } from './weekMealStore'

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

function groupTotals(totals: Map<string, number>): ShoppingCategory[] {
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
    // Seeds 1..7 — the same seeds MealWeekPage uses for the week's days, so
    // the fallback list matches what the week view shows.
    const plan = generateMealPlan(kcal, mealCount, focus, d + 1 + seedOffset * days)
    for (const meal of plan.meals) {
      for (const food of meal.foods) {
        totals.set(food.name, (totals.get(food.name) ?? 0) + food.amount_g)
      }
    }
  }
  return groupTotals(totals)
}

/**
 * Aggregate the shopping list from the ACTUAL foods in a saved week plan.
 * Returns null when the plan has no generated meals — callers fall back to
 * `buildWeeklyShoppingList`.
 */
export function buildShoppingListFromWeekPlan(plan: WeekMealPlan): ShoppingCategory[] | null {
  const totals = new Map<string, number>()
  for (let d = 1; d <= 7; d++) {
    for (const meal of plan.days[d]?.generated?.meals ?? []) {
      for (const food of meal.foods) {
        totals.set(food.name, (totals.get(food.name) ?? 0) + food.amount_g)
      }
    }
  }
  if (totals.size === 0) return null
  return groupTotals(totals)
}

// ── Checked-off state (persisted locally, keyed by list content) ────────────
// The stored state carries a hash of the list it belongs to; when a new list
// is generated the hash changes and the checked state resets automatically.

const KEY = 'formplan_shopping_checked'

/** Stable key for a generated list — item names across all categories. */
export function shoppingListHash(categories: ShoppingCategory[]): string {
  return categories.map((c) => c.items.map((i) => i.name).join('|')).join('||')
}

export function loadChecked(hash: string): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as
      | { hash?: string; items?: string[] }
      | string[]
      | null
    // Legacy format (plain array) has no hash — treat as stale.
    if (!raw || Array.isArray(raw) || raw.hash !== hash) return new Set()
    return new Set(raw.items ?? [])
  } catch {
    return new Set()
  }
}

export function saveChecked(checked: Set<string>, hash: string) {
  localStorage.setItem(KEY, JSON.stringify({ hash, items: [...checked] }))
}

/** Display grams as a friendly amount (e.g. 1500 g → "1,5 kg"). */
export function formatAmount(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toLocaleString('sv-SE', { maximumFractionDigits: 1 })} kg`
  return `${grams} g`
}
