import { Hono } from 'hono'
import type { AppContext } from '../lib/types'
import { requireAuth } from '../middleware/auth'
import {
  sendEmail,
  welcomeEmail,
  progressEmail,
  newsletterEmail,
  magicLinkEmail,
} from '../lib/email'
import { supabaseAdmin } from '../lib/supabase'

export const emailRouter = new Hono<AppContext>()

emailRouter.post('/test-all', async (c) => {
  const { to, secret } = await c.req.json<{ to: string; secret: string }>()
  if (secret !== c.env.WEBHOOK_SECRET) return c.json({ error: 'Forbidden' }, 403)
  const results: Record<string, string> = {}
  const send = async (name: string, subject: string, html: string) => {
    try { await sendEmail(c.env.RESEND_API_KEY, { to, subject, html }); results[name] = 'ok' }
    catch (e) { results[name] = String(e) }
  }
  await send('magic-link', 'Din inloggningslänk till FormPlan', await magicLinkEmail('https://app.formplan.app/auth'))
  await send('welcome', 'Välkommen till FormPlan! 🎉', await welcomeEmail('Robin'))
  await send('progress', 'Din veckorapport — 4 pass genomförda 💪', await progressEmail({
    firstName: 'Robin', workoutsCompleted: 4, workoutsTotal: 5,
    mealDaysCompleted: 6, mealDaysTotal: 7, weightChange: -0.7,
    calorieDeficit: 2350, personalBests: 3, streak: 12,
    motivationalMessage: 'Din kontinuitet den här veckan placerar dig bland de 20 % mest aktiva användarna. Grymt jobbat!',
  }))
  await send('newsletter', 'Nytt i FormPlan 📣', await newsletterEmail({
    title: 'Nytt i FormPlan', subtitle: 'Här är vad som är nytt sedan sist.',
    sections: [
      { title: 'Nya funktioner', items: ['AI-genererade kostplaner', 'Förbättrad makrospårning', 'Smartare träningsprogression', 'Nya visualiseringar av din utveckling'] },
      { title: 'På gång', items: ['Streckkodsskanning av livsmedel', 'Receptgenerator med AI', 'Träningsbibliotek med videor'] },
    ],
    footerText: 'Vi jobbar ständigt på att göra din träningsresa smartare, enklare och mer effektiv.',
  }))
  return c.json(results)
})


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
    `/workout_session?user_id=eq.${user.sub}&completed_at=gte.${since}&select=total_volume_kg,completed_at`
  )

  const workouts = sessions?.length ?? 0
  const volumeKg = sessions?.reduce((s, r) => s + (r.total_volume_kg ?? 0), 0) ?? 0

  // Viktutveckling lagras klientsidan (ingen server-tabell ännu).
  const weightDelta = null

  // Streak (antal dagar i rad med aktivitet)
  const { data: logs } = await db.query<{ completed_at: string }[]>(
    `/workout_session?user_id=eq.${user.sub}&select=completed_at&order=completed_at.desc&limit=30`
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
    subject: `Din veckorapport — ${workouts} pass genomförda 💪`,
    html: await progressEmail({
      firstName: name,
      workoutsCompleted: workouts,
      workoutsTotal: 5,
      mealDaysCompleted: 0,
      mealDaysTotal: 7,
      weightChange: weightDelta,
      calorieDeficit: null,
      personalBests: 0,
      streak,
      motivationalMessage: 'Din kontinuitet placerar dig bland de mest aktiva användarna. Grymt jobbat!',
    }),
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
    title: string
    subtitle: string
    sections: { title: string; items: string[] }[]
    footerText?: string
    ctaText?: string
    ctaUrl?: string
  }>()

  const html = await newsletterEmail({
    title: body.title,
    subtitle: body.subtitle,
    sections: body.sections,
    ...(body.footerText ? { footerText: body.footerText } : {}),
    ...(body.ctaText ? { ctaText: body.ctaText } : {}),
    ...(body.ctaUrl ? { ctaUrl: body.ctaUrl } : {}),
  })
  const results = await Promise.allSettled(
    body.emails.map((to) =>
      sendEmail(c.env.RESEND_API_KEY, { to, subject: body.subject, html })
    )
  )

  const failed = results.filter((r) => r.status === 'rejected').length
  return c.json({ sent: body.emails.length - failed, failed })
})
