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
  duration_min: z.number().nonnegative().nullable().optional(),
  distance_km: z.number().nonnegative().nullable().optional(),
})

const exerciseSchema = z.object({
  name: z.string().min(1).max(120),
  sets: z.array(setSchema).max(50),
})

// POST /workout/session — persist a completed (or partial) workout session.
workoutRouter.post(
  '/session',
  zValidator(
    'json',
    z.object({
      plan_day_id: z.string().uuid().nullable().optional(),
      workout_name: z.string().min(1).max(120),
      started_at: z.string().max(64),
      duration_seconds: z.number().int().nonnegative(),
      exercises: z.array(exerciseSchema).max(50),
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
    if (error || !data?.[0]) {
      console.error('save workout session failed:', error)
      return c.json({ error: 'Kunde inte spara passet just nu. Försök igen.' }, 500)
    }
    return c.json({ session: data[0] }, 201)
  }
)

// GET /workout/exercise-history?name= — last N sessions containing the named exercise.
workoutRouter.get('/exercise-history', async (c) => {
  const user = c.get('user')
  const name = (c.req.query('name') ?? '').trim().toLowerCase()
  if (!name) return c.json({ history: [] })
  const db = supabaseAdmin(c.env)

  const { data } = await db.query<{ completed_at: string; exercises: { name: string; sets: { reps: number; weight_kg: number | null; done: boolean }[] }[] }[]>(
    `/workout_session?user_id=eq.${user.sub}&select=completed_at,exercises&order=completed_at.desc&limit=20`
  )

  const history: { date: string; sets: { reps: number; weight_kg: number | null }[] }[] = []
  for (const session of data ?? []) {
    const match = session.exercises.find((e) => e.name.toLowerCase() === name)
    if (match) {
      history.push({
        date: session.completed_at,
        sets: match.sets.filter((s) => s.done).map((s) => ({ reps: s.reps, weight_kg: s.weight_kg })),
      })
      if (history.length >= 5) break
    }
  }

  return c.json({ history })
})

// GET /workout/sessions?from=ISO&to=ISO — sessions in a window, newest first.
workoutRouter.get('/sessions', async (c) => {
  const user = c.get('user')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const db = supabaseAdmin(c.env)

  let path = `/workout_session?user_id=eq.${user.sub}&select=*&order=completed_at.desc`
  if (from) path += `&completed_at=gte.${encodeURIComponent(from)}`
  if (to) path += `&completed_at=lte.${encodeURIComponent(to)}`

  const { data } = await db.query<WorkoutSessionRow[]>(path)
  return c.json({ sessions: data ?? [] })
})
