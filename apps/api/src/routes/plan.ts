import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin, isUserPremium } from '../lib/supabase'
import { generatePlan } from '../lib/ai'
import { buildMockPlanDays } from '../lib/mockPlan'
import type { AppContext, FitnessProfile, Plan } from '../lib/types'

export const planRouter = new Hono<AppContext>()

planRouter.use('*', requireAuth)

planRouter.post(
  '/generate',
  zValidator('json', z.object({ profile_snapshot: z.record(z.unknown()).optional() })),
  async (c) => {
    const user = c.get('user')
    const db = supabaseAdmin(c.env)

    const premium = await isUserPremium(user.sub, c.env)

    // Free tier: allow only 1 plan ever
    if (!premium) {
      const { data: existing } = await db.query<{ id: string }[]>(
        `/plan?user_id=eq.${user.sub}&select=id&limit=2`
      )
      if (existing && existing.length >= 1) {
        return c.json(
          { error: 'Free tier limit reached. Upgrade to Premium for unlimited plans.' },
          403
        )
      }
    }

    // Fetch profile
    const { data: profileRows } = await db.query<FitnessProfile[]>(
      `/fitness_profile?user_id=eq.${user.sub}&limit=1`
    )
    const profile = profileRows?.[0]
    if (!profile) return c.json({ error: 'No fitness profile found. Create one first.' }, 400)

    // Create plan record with status=generating
    const { data: planRows, error: planErr } = await db.query<{ id: string }[]>('/plan', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.sub, status: 'generating' }),
    })
    if (planErr || !planRows?.[0]) return c.json({ error: 'Failed to create plan' }, 500)
    const planId = planRows[0].id

    // Generate in background — respond immediately with plan id
    c.executionCtx.waitUntil(
      generatePlan(planId, profile, c.env).catch(async (err) => {
        console.error('Plan generation failed:', err)
        await db.query(`/plan?id=eq.${planId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'error' }),
        })
      })
    )

    return c.json({ plan_id: planId, status: 'generating' }, 202)
  }
)

const mockGoalSchema = z.object({
  goal: z.enum(['lose_weight', 'build_muscle', 'maintain', 'improve_endurance']).optional(),
})

// Dev-friendly: insert a ready plan with realistic Swedish mock data (no AI).
planRouter.post('/mock', zValidator('json', mockGoalSchema), async (c) => {
  const user = c.get('user')
  const db = supabaseAdmin(c.env)
  const { goal } = c.req.valid('json')

  const { data: planRows, error: planErr } = await db.query<{ id: string; status: string; created_at: string }[]>(
    '/plan',
    {
      method: 'POST',
      body: JSON.stringify({ user_id: user.sub, status: 'ready' }),
    }
  )
  if (planErr || !planRows?.[0]) return c.json({ error: 'Failed to create mock plan' }, 500)
  const plan = planRows[0]
  const dayRows = buildMockPlanDays(plan.id, goal ?? 'maintain')

  const { error: daysErr } = await db.query('/plan_day', {
    method: 'POST',
    body: JSON.stringify(dayRows),
    headers: { Prefer: 'return=minimal' },
  })
  if (daysErr) {
    await db.query(`/plan?id=eq.${plan.id}`, { method: 'DELETE' })
    return c.json({ error: 'Failed to insert mock plan days' }, 500)
  }

  return c.json({ plan_id: plan.id, status: 'ready', plan }, 201)
})

// List the user's plans, newest first. Registered before '/:id' so the
// literal "list" segment is not captured as a plan id.
planRouter.get('/list', async (c) => {
  const user = c.get('user')
  const db = supabaseAdmin(c.env)
  const { data } = await db.query<Plan[]>(
    `/plan?user_id=eq.${user.sub}&select=id,status,created_at&order=created_at.desc`
  )
  return c.json({ plans: data ?? [] })
})

planRouter.get('/:id', async (c) => {
  const user = c.get('user')
  const planId = encodeURIComponent(c.req.param('id'))
  const db = supabaseAdmin(c.env)

  const { data: plans } = await db.query<{ id: string; user_id: string; status: string; created_at: string }[]>(
    `/plan?id=eq.${planId}&limit=1`
  )
  const plan = plans?.[0]
  if (!plan) return c.json({ error: 'Not found' }, 404)
  if (plan.user_id !== user.sub) return c.json({ error: 'Forbidden' }, 403)

  const { data: days } = await db.query(
    `/plan_day?plan_id=eq.${planId}&order=weekday.asc`
  )

  return c.json({ plan, days: days ?? [] })
})
