import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { requireAccess } from '../middleware/access'
import { supabaseAdmin } from '../lib/supabase'
import { validationHook } from '../lib/validation'
import { isUuid, isDateString, DATE_RE } from '../lib/sanitize'
import type { AppContext, BodyMeasurementRow } from '../lib/types'

export const measurementsRouter = new Hono<AppContext>()

measurementsRouter.use('*', requireAuth)
// Mätningar är en premium-funktion — kräver aktiv provperiod eller prenumeration.
measurementsRouter.use('*', requireAccess)

// Omkretsmått i cm — positivt och rimligt begränsat.
const girth = z.number().positive().max(400).nullable().optional()

const NUMERIC_FIELDS = ['weight_kg', 'waist_cm', 'chest_cm', 'hips_cm', 'arm_cm', 'thigh_cm'] as const

const measurementSchema = z
  .object({
    measured_on: z.string().regex(DATE_RE),
    weight_kg: z.number().positive().max(500).nullable().optional(),
    // Klientens lokala post-id. Finns det görs en UPSERT i stället för en
    // insert, så en re-POST efter ett förlorat svar inte skapar en dubblett.
    client_id: z.string().min(1).max(64).optional(),
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
measurementsRouter.post('/', zValidator('json', measurementSchema, validationHook), async (c) => {
  const user = c.get('user')
  const b = c.req.valid('json')
  const db = supabaseAdmin(c.env)

  const row: Record<string, unknown> = {
    user_id: user.sub,
    measured_on: b.measured_on,
    weight_kg: b.weight_kg ?? null,
    waist_cm: b.waist_cm ?? null,
    chest_cm: b.chest_cm ?? null,
    hips_cm: b.hips_cm ?? null,
    arm_cm: b.arm_cm ?? null,
    thigh_cm: b.thigh_cm ?? null,
  }

  /** Samma skrivning, med eller utan klientens idempotensnyckel. */
  const insert = (withClientId: boolean) => {
    if (!withClientId) {
      return db.query<BodyMeasurementRow[]>('/body_measurement', {
        method: 'POST',
        body: JSON.stringify(row),
        headers: { Prefer: 'return=representation' },
      })
    }
    return db.query<BodyMeasurementRow[]>('/body_measurement?on_conflict=user_id,client_id', {
      method: 'POST',
      body: JSON.stringify({ ...row, client_id: b.client_id }),
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    })
  }

  let { data, error } = await insert(Boolean(b.client_id))

  // Faller tillbaka på en vanlig insert om client_id-vägen inte finns i
  // databasen än. Då har migrationen (2026-10-05-measurement-client-id.sql)
  // inte körts, och PostgREST svarar att kolumnen eller ON CONFLICT-målet är
  // okänt. Utan detta hade varje mätning slutat sparas i fönstret mellan att
  // API:t deployas och att SQL:en körs — ett fönster ingen kan koordinera bort.
  // Kan tas bort när migrationen är körd.
  if (error && b.client_id && /client_id|42P10|42703|PGRST204/i.test(error)) {
    console.warn('measurements: client_id saknas i databasen — kör migrationen. Faller tillbaka.')
    ;({ data, error } = await insert(false))
  }

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
