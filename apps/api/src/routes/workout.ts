import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'
import type { AppContext, WorkoutSessionRow } from '../lib/types'

export const workoutRouter = new Hono<AppContext>()

workoutRouter.use('*', requireAuth)

const setSchema = z.object({
  reps: z.number().int().nonnegative(),
  weight_kg: z.number().nonnegative().nullable(),
  done: z.boolean(),
})

const exerciseSchema = z.object({
  name: z.string(),
  sets: z.array(setSchema),
})

// POST /workout/session — persist a completed (or partial) workout session.
workoutRouter.post(
  '/session',
  zValidator(
    'json',
    z.object({
      plan_day_id: z.string().nullable().optional(),
      workout_name: z.string().min(1),
      started_at: z.string(),
      duration_seconds: z.number().int().nonnegative(),
      exercises: z.array(exerciseSchema),
    })
  ),
  async (c) => {
    const user = c.get('user')
    const b = c.req.valid('json')
    const db = supabaseAdmin(c.env)

    let totalSets = 0
    let completedSets = 0
    let totalVolume = 0
    for (const ex of b.exercises) {
      for (const s of ex.sets) {
        totalSets++
        if (s.done) {
          completedSets++
          totalVolume += s.reps * (s.weight_kg ?? 0)
        }
      }
    }

    const { data, error } = await db.query<WorkoutSessionRow[]>('/workout_session', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.sub,
        plan_day_id: b.plan_day_id ?? null,
        workout_name: b.workout_name,
        started_at: b.started_at,
        completed_at: new Date().toISOString(),
        duration_seconds: b.duration_seconds,
        total_sets: totalSets,
        completed_sets: completedSets,
        total_volume_kg: Math.round(totalVolume * 10) / 10,
        exercises: b.exercises,
      }),
    })
    if (error || !data?.[0]) return c.json({ error: error ?? 'Failed to save session' }, 500)
    return c.json({ session: data[0] }, 201)
  }
)

// GET /workout/sessions?from=ISO&to=ISO — sessions in a window, newest first.
workoutRouter.get('/sessions', async (c) => {
  const user = c.get('user')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const db = supabaseAdmin(c.env)

  let path = `/workout_session?user_id=eq.${user.sub}&select=*&order=completed_at.desc`
  if (from) path += `&completed_at=gte.${from}`
  if (to) path += `&completed_at=lte.${to}`

  const { data } = await db.query<WorkoutSessionRow[]>(path)
  return c.json({ sessions: data ?? [] })
})
