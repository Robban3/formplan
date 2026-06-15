import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { AppContext } from '../lib/types'

export const accountRouter = new Hono<AppContext>()

accountRouter.use('*', requireAuth)

// DELETE /account — permanent radering av kontot (krav i App Store & Google Play).
// Tar bort GoTrue-användaren; all användardata försvinner via ON DELETE CASCADE
// (fitness_profile, food_log, water_log, workout_session, plan, subscriptions m.fl.).
accountRouter.delete('/', async (c) => {
  const user = c.get('user')
  const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/admin/users/${user.sub}`, {
    method: 'DELETE',
    headers: {
      apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  if (!res.ok) {
    console.error('account delete failed:', res.status, await res.text())
    return c.json({ error: 'Kunde inte radera kontot just nu. Försök igen.' }, 500)
  }
  return c.json({ ok: true })
})
