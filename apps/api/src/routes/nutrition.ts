import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'
import { isoWeekday, defaultGoals, goalsFromNutritionDay } from '../lib/derive'
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

const mealSlot = z.enum(['frukost', 'lunch', 'middag', 'mellanmar'])

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

// GET /nutrition/foods/search?q=
nutritionRouter.get('/foods/search', async (c) => {
  const q = (c.req.query('q') ?? '').trim()
  if (!q) return c.json({ items: [] })
  const db = supabaseAdmin(c.env)
  const pattern = `*${encodeURIComponent(q)}*`
  const { data } = await db.query<FoodItemRow[]>(
    `/food_item?name=ilike.${pattern}&select=*&order=name.asc&limit=20`
  )
  return c.json({ items: data ?? [] })
})

// GET /nutrition/log?date=YYYY-MM-DD
nutritionRouter.get('/log', async (c) => {
  const date = c.req.query('date')
  if (!date) return c.json({ error: 'Missing date' }, 400)
  const user = c.get('user')
  const db = supabaseAdmin(c.env)

  const [{ data: entries }, goals] = await Promise.all([
    db.query<FoodLogRow[]>(
      `/food_log?user_id=eq.${user.sub}&log_date=eq.${date}&select=*&order=created_at.asc`
    ),
    resolveDailyGoals(c, user.sub, date),
  ])

  return c.json({
    entries: (entries ?? []).map((e) => ({ ...e, date: e.log_date })),
    goals,
  })
})

// POST /nutrition/log
nutritionRouter.post(
  '/log',
  zValidator(
    'json',
    z.object({
      date: z.string(),
      meal_slot: mealSlot,
      food_id: z.string().nullable().optional(),
      food_name: z.string().min(1),
      amount_g: z.number().positive(),
      kcal: z.number().nonnegative(),
      protein_g: z.number().nonnegative(),
      fat_g: z.number().nonnegative(),
      carbs_g: z.number().nonnegative(),
    })
  ),
  async (c) => {
    const user = c.get('user')
    const b = c.req.valid('json')
    const db = supabaseAdmin(c.env)

    const { data, error } = await db.query<FoodLogRow[]>('/food_log', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.sub,
        log_date: b.date,
        meal_slot: b.meal_slot,
        food_id: b.food_id ?? null,
        food_name: b.food_name,
        amount_g: b.amount_g,
        kcal: b.kcal,
        protein_g: b.protein_g,
        fat_g: b.fat_g,
        carbs_g: b.carbs_g,
      }),
    })
    if (error || !data?.[0]) return c.json({ error: error ?? 'Failed to add entry' }, 500)
    return c.json({ entry: { ...data[0], date: data[0].log_date } }, 201)
  }
)

// DELETE /nutrition/log/:id
nutritionRouter.delete('/log/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const db = supabaseAdmin(c.env)
  const { error } = await db.query(
    `/food_log?id=eq.${id}&user_id=eq.${user.sub}`,
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
  )
  if (error) return c.json({ error }, 500)
  return c.body(null, 204)
})

// GET /nutrition/water?date=YYYY-MM-DD
nutritionRouter.get('/water', async (c) => {
  const date = c.req.query('date')
  if (!date) return c.json({ error: 'Missing date' }, 400)
  const user = c.get('user')
  const db = supabaseAdmin(c.env)
  const { data } = await db.query<WaterLogRow[]>(
    `/water_log?user_id=eq.${user.sub}&log_date=eq.${date}&select=*&order=logged_at.asc`
  )
  const entries = (data ?? []).map((e) => ({ ...e, date: e.log_date }))
  const total_ml = entries.reduce((s, e) => s + e.amount_ml, 0)
  return c.json({ entries, total_ml })
})

// POST /nutrition/water
nutritionRouter.post(
  '/water',
  zValidator('json', z.object({ date: z.string(), amount_ml: z.number().int().positive() })),
  async (c) => {
    const user = c.get('user')
    const b = c.req.valid('json')
    const db = supabaseAdmin(c.env)
    const { data, error } = await db.query<WaterLogRow[]>('/water_log', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.sub, log_date: b.date, amount_ml: b.amount_ml }),
    })
    if (error || !data?.[0]) return c.json({ error: error ?? 'Failed to add water' }, 500)
    return c.json({ entry: { ...data[0], date: data[0].log_date } }, 201)
  }
)

// DELETE /nutrition/water/:id
nutritionRouter.delete('/water/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const db = supabaseAdmin(c.env)
  const { error } = await db.query(
    `/water_log?id=eq.${id}&user_id=eq.${user.sub}`,
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
  )
  if (error) return c.json({ error }, 500)
  return c.body(null, 204)
})
