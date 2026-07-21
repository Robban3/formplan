import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'
import { isUuid, isDateString, DATE_RE } from '../lib/sanitize'
import type { AppContext, BodyMeasurementRow } from '../lib/types'

export const measurementsRouter = new Hono<AppContext>()

measurementsRouter.use('*', requireAuth)

// Omkretsmått i cm — positivt och rimligt begränsat.
const girth = z.number().positive().max(400).nullable().optional()

const NUMERIC_FIELDS = ['weight_kg', 'waist_cm', 'chest_cm', 'hips_cm', 'arm_cm', 'thigh_cm'] as const

const measurementSchema = z
  .object({
    measured_on: z.string().regex(DATE_RE),
    weight_kg: z.number().positive().max(500).nullable().optional(),
    waist_cm: girth,
    chest_cm: girth,
    hips_cm: girth,
    arm_cm: girth,
    thigh_cm: girth,
  })
  .refine((b) => NUMERIC_FIELDS.some((f) => typeof b[f] === 'number'), {
    message: 'Minst ett mätvärde krävs.',
  })

// GET /measurements?from=YYYY-MM-DD&to=YYYY-MM-DD — user's measurements, newest first.
measurementsRouter.get('/', async (c) => {
  const user = c.get('user')
  const from = c.req.query('from')
  const to = c.req.query('to')
  if ((from && !isDateString(from)) || (to && !isDateString(to))) {
    return c.json({ error: 'Ogiltigt datum — använd formatet YYYY-MM-DD.' }, 400)
  }
  const db = supabaseAdmin(c.env)

  let path = `/body_measurement?user_id=eq.${user.sub}&select=*&order=measured_on.desc`
  if (from) path += `&measured_on=gte.${from}`
  if (to) path += `&measured_on=lte.${to}`

  const { data, error } = await db.query<BodyMeasurementRow[]>(path)
  if (error) {
    console.error('list measurements failed:', error)
    return c.json({ error: 'Kunde inte hämta mätningarna just nu. Försök igen.' }, 500)
  }
  return c.json({ measurements: data ?? [] })
})

// POST /measurements — log a new body measurement (≥1 numeric field required).
measurementsRouter.post('/', zValidator('json', measurementSchema), async (c) => {
  const user = c.get('user')
  const b = c.req.valid('json')
  const db = supabaseAdmin(c.env)

  const { data, error } = await db.query<BodyMeasurementRow[]>('/body_measurement', {
    method: 'POST',
    body: JSON.stringify({
      user_id: user.sub,
      measured_on: b.measured_on,
      weight_kg: b.weight_kg ?? null,
      waist_cm: b.waist_cm ?? null,
      chest_cm: b.chest_cm ?? null,
      hips_cm: b.hips_cm ?? null,
      arm_cm: b.arm_cm ?? null,
      thigh_cm: b.thigh_cm ?? null,
    }),
    headers: { Prefer: 'return=representation' },
  })
  if (error || !data?.[0]) {
    console.error('add measurement failed:', error)
    return c.json({ error: 'Kunde inte spara mätningen just nu. Försök igen.' }, 500)
  }
  return c.json({ measurement: data[0] }, 201)
})

// DELETE /measurements/:id — remove one of the user's measurements.
measurementsRouter.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Mätningen hittades inte.' }, 404)
  const db = supabaseAdmin(c.env)

  const { error } = await db.query(`/body_measurement?id=eq.${id}&user_id=eq.${user.sub}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })
  if (error) {
    console.error('delete measurement failed:', error)
    return c.json({ error: 'Kunde inte ta bort mätningen just nu. Försök igen.' }, 500)
  }
  return c.json({ ok: true })
})
