import { Hono } from 'hono'
import Stripe from 'stripe'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'
import type { AppContext } from '../lib/types'

export const accountRouter = new Hono<AppContext>()

accountRouter.use('*', requireAuth)

// Är Stripe-felet "prenumerationen finns inte / är redan avslutad"? I så fall
// är det säkert att fortsätta radera kontot.
function isAlreadyCanceled(err: unknown): boolean {
  const code = (err as { code?: string }).code
  if (code === 'resource_missing') return true
  const msg = err instanceof Error ? err.message : String(err)
  return /already.+cancel|cancel(l)?ed subscription|no such subscription/i.test(msg)
}

// DELETE /account — permanent radering av kontot (krav i App Store & Google Play).
// Avslutar först en eventuell aktiv Stripe-prenumeration — annars fortsätter
// debiteringen efter att kontot (och subscriptions-raden) raderats via CASCADE.
// Tar sedan bort GoTrue-användaren; all användardata försvinner via ON DELETE
// CASCADE (fitness_profile, food_log, water_log, workout_session, plan, subscriptions m.fl.).
accountRouter.delete('/', async (c) => {
  const user = c.get('user')
  const db = supabaseAdmin(c.env)

  const { data: subs, error: subErr } = await db.query<
    { stripe_subscription_id: string | null }[]
  >(`/subscriptions?user_id=eq.${user.sub}&select=stripe_subscription_id&limit=1`)
  if (subErr) {
    // Kan inte avgöra om en aktiv prenumeration finns — radera INTE kontot.
    console.error('account delete: could not read subscription row:', subErr)
    return c.json({ error: 'Kunde inte radera kontot just nu. Försök igen.' }, 500)
  }

  const subscriptionId = subs?.[0]?.stripe_subscription_id
  if (subscriptionId) {
    if (!c.env.STRIPE_SECRET_KEY) {
      console.error('account delete: STRIPE_SECRET_KEY missing but user has a subscription')
      return c.json({ error: 'Kunde inte avsluta prenumerationen. Försök igen senare.' }, 500)
    }
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY)
    try {
      await stripe.subscriptions.cancel(subscriptionId)
    } catch (err) {
      if (!isAlreadyCanceled(err)) {
        console.error('account delete: Stripe cancellation failed:', err)
        return c.json(
          { error: 'Kunde inte avsluta prenumerationen. Försök igen eller kontakta support.' },
          500
        )
      }
    }
  }

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
