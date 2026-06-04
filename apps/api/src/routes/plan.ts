import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin, isUserPremium } from '../lib/supabase'
import { generatePlan } from '../lib/ai'
import type { Env, FitnessProfile } from '../lib/types'

export const planRouter = new Hono<{ Bindings: Env }>()

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

planRouter.get('/:id', async (c) => {
  const user = c.get('user')
  const planId = c.req.param('id')
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
