import { Hono } from 'hono'
import type { AppContext } from '../lib/types'
import { requireAuth } from '../middleware/auth'
import {
  sendEmail,
  welcomeEmail,
  progressEmail,
  newsletterEmail,
} from '../lib/email'
import { supabaseAdmin } from '../lib/supabase'

export const emailRouter = new Hono<AppContext>()

/**
 * POST /email/webhook/new-user
 * Triggas av Supabase Database Webhook när en ny rad skapas i auth.users.
 * Valideras med WEBHOOK_SECRET istället för JWT.
 *
 * Supabase skickar: { type: "INSERT", table: "users", schema: "auth", record: { email, raw_user_meta_data, ... } }
 */
emailRouter.post('/webhook/new-user', async (c) => {
  // Validera hemlig nyckel
  const secret = c.req.header('x-webhook-secret')
  if (!secret || secret !== c.env.WEBHOOK_SECRET) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const payload = await c.req.json<{
    record?: { email?: string; raw_user_meta_data?: { full_name?: string; name?: string } }
  }>()

  const email = payload.record?.email
  if (!email) return c.json({ error: 'No email in payload' }, 400)

  const name =
    payload.record?.raw_user_meta_data?.full_name ??
    payload.record?.raw_user_meta_data?.name ??
    email.split('@')[0] ??
    'där'

  await sendEmail(c.env.RESEND_API_KEY, {
    to: email,
    subject: 'Välkommen till FormPlan! 🎉',
    html: await welcomeEmail(name),
  })

  return c.json({ ok: true })
})

/**
 * POST /email/welcome
 * Skickas automatiskt när en ny användare skapas (kallas från Supabase webhook eller manuellt).
 */
emailRouter.post('/welcome', requireAuth, async (c) => {
  const user = c.get('user')
  const name = (user.user_metadata?.full_name as string) ?? user.email?.split('@')[0] ?? ''

  await sendEmail(c.env.RESEND_API_KEY, {
    to: user.email,
    subject: 'Välkommen till FormPlan! 🎉',
    html: await welcomeEmail(name),
  })

  return c.json({ ok: true })
})

/**
 * POST /email/progress
 * Veckorapport — kan triggas av en cron-job i Cloudflare Workers.
 * Body: { user_id?: string }  (admin kan ange specifik användare)
 */
emailRouter.post('/progress', requireAuth, async (c) => {
  const user = c.get('user')
  const db = supabaseAdmin(c.env)

  // Hämta träningspass senaste 7 dagarna
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: sessions } = await db.query<{ total_volume_kg: number; completed_at: string }[]>(
    `/workout_sessions?user_id=eq.${user.sub}&completed_at=gte.${since}&select=total_volume_kg,completed_at`
  )

  const workouts = sessions?.length ?? 0
  const volumeKg = sessions?.reduce((s, r) => s + (r.total_volume_kg ?? 0), 0) ?? 0

  // Senaste viktutveckling
  const { data: weights } = await db.query<{ weight_kg: number; measured_at: string }[]>(
    `/measurements?user_id=eq.${user.sub}&select=weight_kg,measured_at&order=measured_at.desc&limit=2`
  )

  const weightDelta =
    weights && weights.length === 2
      ? ((weights[0]?.weight_kg ?? 0) - (weights[1]?.weight_kg ?? 0))
      : null

  // Streak (antal dagar i rad med aktivitet)
  const { data: logs } = await db.query<{ completed_at: string }[]>(
    `/workout_sessions?user_id=eq.${user.sub}&select=completed_at&order=completed_at.desc&limit=30`
  )

  let streak = 0
  if (logs?.length) {
    const days = new Set(logs.map((l) => l.completed_at.slice(0, 10)))
    let d = new Date()
    while (days.has(d.toISOString().slice(0, 10))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
  }

  const name = (user.user_metadata?.full_name as string) ?? user.email?.split('@')[0] ?? ''

  await sendEmail(c.env.RESEND_API_KEY, {
    to: user.email,
    subject: `Din veckorapport — ${workouts} pass den här veckan 💪`,
    html: await progressEmail({ name, workouts, volumeKg, weightDelta, streak }),
  })

  return c.json({ ok: true })
})

/**
 * POST /email/newsletter
 * Admin-only: skicka nyhetsbrev till en lista användare.
 * Body: { emails: string[], subject, heading, body, ctaText?, ctaUrl? }
 */
emailRouter.post('/newsletter', requireAuth, async (c) => {
  const user = c.get('user')
  // Enkel admin-check — byt mot riktig roll-kontroll vid behov
  if (!user.email?.endsWith('@formplan.app') && user.email !== 'rvdv1122@gmail.com') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json<{
    emails: string[]
    subject: string
    heading: string
    body: string
    ctaText?: string
    ctaUrl?: string
  }>()

  const html = await newsletterEmail({ subject: body.subject, heading: body.heading, body: body.body })
  const results = await Promise.allSettled(
    body.emails.map((to) =>
      sendEmail(c.env.RESEND_API_KEY, { to, subject: body.subject, html })
    )
  )

  const failed = results.filter((r) => r.status === 'rejected').length
  return c.json({ sent: body.emails.length - failed, failed })
})
