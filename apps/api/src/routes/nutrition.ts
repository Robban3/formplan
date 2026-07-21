import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { requireAccess } from '../middleware/access'
import { supabaseAdmin } from '../lib/supabase'
import { rateLimit } from '../lib/rateLimit'
import { validationHook } from '../lib/validation'
import { isoWeekday, defaultGoals, goalsFromNutritionDay } from '../lib/derive'
import { sanitizeSearchTerm, isUuid, isDateString, DATE_RE } from '../lib/sanitize'
import type {
  AppContext,
  DailyGoals,
  FoodItemRow,
  FoodLogRow,
  NutritionDay,
  Plan,
  WaterLogRow,
} from '../lib/types'

export const nutritionRouter = new Hono<AppContext>()

nutritionRouter.use('*', requireAuth)
// Kostloggning är en premium-funktion — kräver aktiv provperiod eller prenumeration.
nutritionRouter.use('*', requireAccess)

const mealSlot = z.enum(['frukost', 'lunch', 'middag', 'mellanmar'])

// Största tillåtna datumintervall för summeringar (skyddar mot orimligt stora
// PostgREST-svar). Returnerar antal dagar mellan två YYYY-MM-DD-strängar.
const MAX_SUMMARY_DAYS = 400
function rangeDays(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)
}

// Resolve the user's daily macro goals for a given date. Prefers the nutrition
// day from their latest ready plan that matches the weekday, then falls back to
// the profile calorie goal, then a sensible default.
async function resolveDailyGoals(
  c: { env: AppContext['Bindings'] },
  userId: string,
  date: string
): Promise<DailyGoals> {
  const db = supabaseAdmin(c.env)

  const { data: plans } = await db.query<Plan[]>(
    `/plan?user_id=eq.${userId}&status=eq.ready&select=id&order=created_at.desc&limit=1`
  )
  const planId = plans?.[0]?.id
  if (planId) {
    const weekday = isoWeekday(date)
    const { data: days } = await db.query<{ content: NutritionDay }[]>(
      `/plan_day?plan_id=eq.${planId}&type=eq.nutrition&weekday=eq.${weekday}&select=content&limit=1`
    )
    const content = days?.[0]?.content
    if (content) return goalsFromNutritionDay(content)
  }

  const { data: profiles } = await db.query<{ calorie_goal: number | null }[]>(
    `/fitness_profile?user_id=eq.${userId}&select=calorie_goal&limit=1`
  )
  return defaultGoals(profiles?.[0]?.calorie_goal ?? null)
}

// ── Open Food Facts (server-side proxy) ─────────────────────────────────────
// Körs i Workern (obegränsad egress + korrekt User-Agent), inte i webbläsaren,
// så vi slipper CORS/rate-limit-problem. Resultat märks med id "off-<code>" så
// klienten loggar dem med food_id = null (ingen FK till food_item).
interface OffNutriments {
  'energy-kcal_100g'?: number
  energy_100g?: number
  proteins_100g?: number
  fat_100g?: number
  carbohydrates_100g?: number
}
interface OffProduct {
  code?: string
  product_name?: string
  brands?: string
  nutriments?: OffNutriments
  serving_quantity?: number | string
}
const r1 = (n: number) => Math.round(n * 10) / 10

async function searchOpenFoodFacts(q: string): Promise<FoodItemRow[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=30` +
    `&fields=code,product_name,brands,nutriments,serving_quantity`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 6000)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FormPlan/1.0 (https://formplan.app)' },
      signal: ctrl.signal,
    })
    if (!res.ok) return []
    const data = (await res.json()) as { products?: OffProduct[] }
    const out: FoodItemRow[] = []
    const seen = new Set<string>()
    for (const p of data.products ?? []) {
      const base = p.product_name?.trim()
      if (!base) continue
      const n = p.nutriments ?? {}
      const kcal = n['energy-kcal_100g'] ?? (n.energy_100g ? n.energy_100g / 4.184 : 0)
      const protein = n.proteins_100g ?? 0
      const fat = n.fat_100g ?? 0
      const carbs = n.carbohydrates_100g ?? 0
      if (kcal <= 0 && protein <= 0 && fat <= 0 && carbs <= 0) continue
      const brand = p.brands?.split(',')[0]?.trim() || null
      const name = brand ? `${base} (${brand})` : base
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        id: `off-${p.code ?? key}`,
        name,
        brand,
        kcal_per_100g: Math.round(kcal),
        protein_per_100g: r1(protein),
        fat_per_100g: r1(fat),
        carbs_per_100g: r1(carbs),
        serving_size_g: typeof p.serving_quantity === 'number' ? p.serving_quantity : null,
      })
    }
    return out
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

// GET /nutrition/foods/search?q=  — lokala curated-livsmedel + Open Food Facts.
// Rate-limitad: proxyn gör externa OFF-anrop och får inte gå att hamra.
nutritionRouter.get('/foods/search', rateLimit('foods-search', 120), async (c) => {
  // Strip PostgREST metacharacters (* , ( ) & =) from the term — several of
  // them pass through encodeURIComponent untouched and could otherwise alter
  // the ilike pattern or the filter tree.
  const q = sanitizeSearchTerm((c.req.query('q') ?? '').slice(0, 100))
  if (q.length < 2) return c.json({ items: [] })
  const db = supabaseAdmin(c.env)
  // Encode only the user term — keep the * wildcards literal for PostgREST ilike.
  const pattern = `*${encodeURIComponent(q)}*`

  const [localRes, off] = await Promise.all([
    db.query<FoodItemRow[]>(`/food_item?name=ilike.${pattern}&select=*&order=name.asc&limit=20`),
    searchOpenFoodFacts(q),
  ])
  // Dedupa lokala rader på gemener-namn (tidigare seed-körningar kan ha skapat
  // dubbletter) innan de slås ihop med OFF-resultaten.
  const local: FoodItemRow[] = []
  const localNames = new Set<string>()
  for (const item of localRes.data ?? []) {
    const key = item.name.toLowerCase()
    if (localNames.has(key)) continue
    localNames.add(key)
    local.push(item)
  }
  const items = [...local, ...off.filter((o) => !localNames.has(o.name.toLowerCase()))]
  return c.json({ items })
})

// GET /nutrition/log?date=YYYY-MM-DD
nutritionRouter.get('/log', async (c) => {
  const date = c.req.query('date')
  if (!date || !isDateString(date)) {
    return c.json({ error: 'Ogiltigt eller saknat datum — använd formatet YYYY-MM-DD.' }, 400)
  }
  const user = c.get('user')
  const db = supabaseAdmin(c.env)

  const [logRes, goals] = await Promise.all([
    db.query<FoodLogRow[]>(
      `/food_log?user_id=eq.${user.sub}&log_date=eq.${encodeURIComponent(date)}&select=*&order=created_at.asc`
    ),
    resolveDailyGoals(c, user.sub, date),
  ])
  if (logRes.error) {
    console.error('get food log failed:', logRes.error)
    return c.json({ error: 'Kunde inte hämta måltiderna just nu. Försök igen.' }, 500)
  }

  return c.json({
    entries: (logRes.data ?? []).map((e) => ({ ...e, date: e.log_date })),
    goals,
  })
})

// En loggpost. Beloppen är hårt begränsade — orimliga värden (t.ex. 1e9 kcal)
// skulle annars förstöra summeringar och veckorapporter.
const logEntrySchema = z.object({
  date: z.string().regex(DATE_RE),
  meal_slot: mealSlot,
  food_id: z.string().uuid().nullable().optional(),
  food_name: z.string().min(1).max(200),
  serving_label: z.string().max(40).nullable().optional(),
  amount_g: z.number().positive().max(5000),
  kcal: z.number().nonnegative().max(10_000),
  protein_g: z.number().nonnegative().max(1000),
  fat_g: z.number().nonnegative().max(1000),
  carbs_g: z.number().nonnegative().max(1000),
})

// POST /nutrition/log — ett objekt ELLER en array (batch, t.ex. "logga hela
// fotoanalysen"). Batch skrivs som EN PostgREST-insert så allt-eller-inget gäller.
nutritionRouter.post(
  '/log',
  zValidator('json', z.union([logEntrySchema, z.array(logEntrySchema).min(1).max(30)]), validationHook),
  async (c) => {
    const user = c.get('user')
    const body = c.req.valid('json')
    const db = supabaseAdmin(c.env)

    const isBatch = Array.isArray(body)
    const rows = (isBatch ? body : [body]).map((b) => ({
      user_id: user.sub,
      log_date: b.date,
      meal_slot: b.meal_slot,
      food_id: b.food_id ?? null,
      food_name: b.food_name,
      serving_label: b.serving_label ?? null,
      amount_g: b.amount_g,
      kcal: b.kcal,
      protein_g: b.protein_g,
      fat_g: b.fat_g,
      carbs_g: b.carbs_g,
    }))

    const { data, error } = await db.query<FoodLogRow[]>('/food_log', {
      method: 'POST',
      body: JSON.stringify(rows),
    })
    if (error || !data || data.length !== rows.length) {
      console.error('add food log failed:', error)
      return c.json({ error: 'Kunde inte spara måltiden just nu. Försök igen.' }, 500)
    }
    const entries = data.map((e) => ({ ...e, date: e.log_date }))
    // Enkelobjekt behåller sin gamla svarsform ({ entry }) för kompatibilitet.
    if (!isBatch) return c.json({ entry: entries[0] }, 201)
    return c.json({ entries }, 201)
  }
)

// DELETE /nutrition/log/:id
nutritionRouter.delete('/log/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Posten hittades inte.' }, 404)
  const db = supabaseAdmin(c.env)
  const { error } = await db.query(
    `/food_log?id=eq.${id}&user_id=eq.${user.sub}`,
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
  )
  if (error) {
    console.error('delete food log failed:', error)
    return c.json({ error: 'Kunde inte ta bort posten just nu. Försök igen.' }, 500)
  }
  return c.body(null, 204)
})

// GET /nutrition/water/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
nutritionRouter.get('/water/summary', async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  if (!from || !to || !isDateString(from) || !isDateString(to)) {
    return c.json({ error: 'Ogiltigt eller saknat datumintervall — använd formatet YYYY-MM-DD.' }, 400)
  }
  if (rangeDays(from, to) > MAX_SUMMARY_DAYS) {
    return c.json({ error: 'Datumintervallet är för stort — max 400 dagar.' }, 400)
  }
  const user = c.get('user')
  const db = supabaseAdmin(c.env)

  const { data, error } = await db.query<Pick<WaterLogRow, 'log_date' | 'amount_ml'>[]>(
    `/water_log?user_id=eq.${user.sub}&log_date=gte.${encodeURIComponent(from)}&log_date=lte.${encodeURIComponent(to)}&select=log_date,amount_ml`
  )
  if (error) {
    console.error('water summary failed:', error)
    return c.json({ error: 'Kunde inte hämta vattenhistoriken just nu. Försök igen.' }, 500)
  }

  const map = new Map<string, number>()
  for (const row of data ?? []) {
    map.set(row.log_date, (map.get(row.log_date) ?? 0) + row.amount_ml)
  }

  const days = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total_ml]) => ({ date, total_ml }))

  return c.json({ days })
})

// GET /nutrition/water?date=YYYY-MM-DD
nutritionRouter.get('/water', async (c) => {
  const date = c.req.query('date')
  if (!date || !isDateString(date)) {
    return c.json({ error: 'Ogiltigt eller saknat datum — använd formatet YYYY-MM-DD.' }, 400)
  }
  const user = c.get('user')
  const db = supabaseAdmin(c.env)
  const { data, error } = await db.query<WaterLogRow[]>(
    `/water_log?user_id=eq.${user.sub}&log_date=eq.${encodeURIComponent(date)}&select=*&order=logged_at.asc`
  )
  if (error) {
    console.error('get water log failed:', error)
    return c.json({ error: 'Kunde inte hämta vattenloggen just nu. Försök igen.' }, 500)
  }
  const entries = (data ?? []).map((e) => ({ ...e, date: e.log_date }))
  const total_ml = entries.reduce((s, e) => s + e.amount_ml, 0)
  return c.json({ entries, total_ml })
})

// POST /nutrition/water
nutritionRouter.post(
  '/water',
  zValidator('json', z.object({ date: z.string().regex(DATE_RE), amount_ml: z.number().int().positive().max(10_000) }), validationHook),
  async (c) => {
    const user = c.get('user')
    const b = c.req.valid('json')
    const db = supabaseAdmin(c.env)
    const { data, error } = await db.query<WaterLogRow[]>('/water_log', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.sub, log_date: b.date, amount_ml: b.amount_ml }),
    })
    if (error || !data?.[0]) {
      console.error('add water log failed:', error)
      return c.json({ error: 'Kunde inte spara vattnet just nu. Försök igen.' }, 500)
    }
    return c.json({ entry: { ...data[0], date: data[0].log_date } }, 201)
  }
)

// DELETE /nutrition/water/:id
nutritionRouter.delete('/water/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Posten hittades inte.' }, 404)
  const db = supabaseAdmin(c.env)
  const { error } = await db.query(
    `/water_log?id=eq.${id}&user_id=eq.${user.sub}`,
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
  )
  if (error) {
    console.error('delete water log failed:', error)
    return c.json({ error: 'Kunde inte ta bort posten just nu. Försök igen.' }, 500)
  }
  return c.body(null, 204)
})

// GET /nutrition/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns per-day calorie + macro totals for charting.
nutritionRouter.get('/summary', async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  if (!from || !to || !isDateString(from) || !isDateString(to)) {
    return c.json({ error: 'Ogiltigt eller saknat datumintervall — använd formatet YYYY-MM-DD.' }, 400)
  }
  if (rangeDays(from, to) > MAX_SUMMARY_DAYS) {
    return c.json({ error: 'Datumintervallet är för stort — max 400 dagar.' }, 400)
  }
  const user = c.get('user')
  const db = supabaseAdmin(c.env)

  const { data, error } = await db.query<Pick<FoodLogRow, 'log_date' | 'kcal' | 'protein_g' | 'fat_g' | 'carbs_g'>[]>(
    `/food_log?user_id=eq.${user.sub}&log_date=gte.${encodeURIComponent(from)}&log_date=lte.${encodeURIComponent(to)}&select=log_date,kcal,protein_g,fat_g,carbs_g`
  )
  if (error) {
    console.error('nutrition summary failed:', error)
    return c.json({ error: 'Kunde inte hämta kosthistoriken just nu. Försök igen.' }, 500)
  }

  // Aggregate per date in the worker (PostgREST has no GROUP BY).
  const map = new Map<string, { kcal: number; protein_g: number; fat_g: number; carbs_g: number; entries: number }>()
  for (const row of data ?? []) {
    const existing = map.get(row.log_date) ?? { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0, entries: 0 }
    map.set(row.log_date, {
      kcal:      existing.kcal      + row.kcal,
      protein_g: existing.protein_g + row.protein_g,
      fat_g:     existing.fat_g     + row.fat_g,
      carbs_g:   existing.carbs_g   + row.carbs_g,
      entries:   existing.entries   + 1,
    })
  }

  const days = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totals]) => ({
      date,
      kcal:      Math.round(totals.kcal),
      protein_g: Math.round(totals.protein_g),
      fat_g:     Math.round(totals.fat_g),
      carbs_g:   Math.round(totals.carbs_g),
      entries:   totals.entries,
    }))

  return c.json({ days })
})
