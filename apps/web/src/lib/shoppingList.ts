import { generateMealPlan, type DietFocus, type MealCount } from './mealPlanGenerator'
import type { WeekMealPlan } from './weekMealStore'
import {
  formatIngredientAmount,
  ingredientKey,
  mergeIngredients,
  type ParsedIngredient,
  type UnitFamily,
} from './recipeIngredients'

export interface ShoppingItem {
  name: string
  /** Mängd i familjens basenhet (g, ml, st). null = mängd okänd. */
  amount: number | null
  /**
   * Enhetsfamilj. Veckoschemats livsmedel är alltid 'mass' — fältet finns för
   * ingredienser från recept, som kommer i dl, msk och styck. Utan det hade
   * "2 dl havregryn" blivit "2 g" på vägen in i listan.
   */
  family: UnitFamily | null
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
    list.push({ name, amount: Math.round(amount_g), family: 'mass' })
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
 *
 * `restrictions` är OBLIGATORISKT och har med avsikt inget standardvärde.
 * Anropet saknade det helt, så fallback-listan byggdes ur en OFILTRERAD
 * matsedel: inköpslistan sa åt någon som kryssat ägg och laktos att köpa ägg
 * och kvarg. Ett standardvärde på tom lista hade gjort samma fel möjligt igen
 * utan att bygget sa något — en ny anropare ska tvingas skicka profilens
 * hänsyn. (Listan som byggs ur ett SPARAT veckoschema är redan filtrerad:
 * maten i schemat gick genom filtret när schemat skapades.)
 */
export function buildWeeklyShoppingList(
  kcal: number,
  focus: DietFocus,
  mealCount: MealCount,
  restrictions: readonly string[],
  days = 7,
  seedOffset = 0
): ShoppingCategory[] {
  const totals = new Map<string, number>()
  for (let d = 0; d < days; d++) {
    // Seeds 1..7 — the same seeds MealWeekPage uses for the week's days, so
    // the fallback list matches what the week view shows.
    const plan = generateMealPlan(kcal, mealCount, focus, d + 1 + seedOffset * days, restrictions)
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

/**
 * Lägger receptens ingredienser i samma kategorilista som veckoschemats.
 *
 * Posterna slås ihop med varandra (två recept med kyckling ger en rad) men
 * INTE med veckoschemats. Skälet är att de räknas olika: veckoschemats
 * mängder kommer ur en kurerad livsmedelslista med exakta gram per portion,
 * receptens ur fritext där "kycklingfilé" och "kyckling" är olika strängar.
 * Slog man ihop dem skulle en felstavning se ut som en dubbel mängd.
 *
 * Samma namn OCH samma enhetsfamilj krävs för att en receptpost ska läggas
 * till en befintlig rad från veckoschemat — därav nyckeln nedan.
 */
export function withRecipeIngredients(
  categories: ShoppingCategory[],
  recipeIngredients: ParsedIngredient[]
): ShoppingCategory[] {
  if (recipeIngredients.length === 0) return categories

  const byCategory = new Map<string, ShoppingItem[]>()
  for (const c of categories) byCategory.set(c.category, [...c.items])

  for (const item of mergeIngredients(recipeIngredients)) {
    const category = categorize(item.name)
    const list = byCategory.get(category) ?? []
    // Finns varan redan med samma enhetsfamilj summeras den; annars en ny rad.
    const existing = list.find(
      (i) =>
        i.family === item.family &&
        i.amount !== null &&
        item.amount !== null &&
        ingredientKey(i.name) === ingredientKey(item.name)
    )
    if (existing) existing.amount = (existing.amount ?? 0) + (item.amount ?? 0)
    else list.push({ name: item.name, amount: item.amount, family: item.family })
    byCategory.set(category, list)
  }

  return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
    category,
    items: byCategory.get(category)!.sort((a, b) => a.name.localeCompare(b.name, 'sv')),
  }))
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

/**
 * Mängden som text.
 *
 * Delegerar till formatIngredientAmount så veckoschemats poster och receptens
 * visas likadant — den hanterar dessutom dl, msk och styck, vilket den gamla
 * gram-only-varianten inte gjorde.
 */
export function formatAmount(item: ShoppingItem, locale: string): string {
  return formatIngredientAmount(item.amount, item.family, locale)
}
