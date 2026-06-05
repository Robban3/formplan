import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'
import type { AppContext } from '../lib/types'

export const profileRouter = new Hono<AppContext>()

const profileSchema = z.object({
  goal: z.enum(['lose_weight', 'build_muscle', 'maintain', 'improve_endurance']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  equipment: z.array(z.string()).min(1),
  days_per_week: z.number().int().min(1).max(7),
  allergies: z.array(z.string()),
  calorie_goal: z.number().int().positive().nullable(),
  age: z.number().int().min(13).max(120).nullable(),
  weight_kg: z.number().positive().nullable(),
  height_cm: z.number().positive().nullable(),
})

profileRouter.use('*', requireAuth)

profileRouter.get('/', async (c) => {
  const user = c.get('user')
  const db = supabaseAdmin(c.env)
  const { data, error } = await db.query(
    `/fitness_profile?user_id=eq.${user.sub}&limit=1`
  )
  if (error) return c.json({ error }, 500)
  return c.json({ profile: Array.isArray(data) ? data[0] ?? null : null })
})

profileRouter.post('/', zValidator('json', profileSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')
  const db = supabaseAdmin(c.env)

  const payload = { ...body, user_id: user.sub, updated_at: new Date().toISOString() }

  const { data, error } = await db.query('/fitness_profile', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  })

  if (error) return c.json({ error }, 500)
  return c.json({ profile: Array.isArray(data) ? data[0] : data })
})
