import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import Stripe from 'stripe'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'
import { validationHook } from '../lib/validation'
import { PRICE_SEK_ORE, resolveAccess } from '../lib/access'
import type { AppContext } from '../lib/types'

export const billingRouter = new Hono<AppContext>()

billingRouter.use('*', requireAuth)

// GET /billing/status — access = within 7-day trial (from signup) OR active sub.
billingRouter.get('/status', async (c) => {
  const user = c.get('user')
  const status = await resolveAccess(user, c.env)
  return c.json({ ...status, price_sek: PRICE_SEK_ORE / 100 })
})

// POST /billing/checkout — start a Stripe Checkout session for 99 kr/month.
billingRouter.post(
  '/checkout',
  zValidator('json', z.object({ origin: z.string().url().optional() }), validationHook),
  async (c) => {
    const user = c.get('user')
    const { origin } = c.req.valid('json')
    const base = origin ?? 'https://app.formplan.app'

    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json({ error: 'Betalning är inte tillgänglig just nu. Försök igen senare.' }, 503)
    }

    // Återanvänd befintlig Stripe-kund om en finns — annars kan upprepade
    // checkouts skapa parallella kunder/prenumerationer för samma användare.
    const db = supabaseAdmin(c.env)
    const { data: subRows } = await db.query<{ stripe_customer_id: string | null }[]>(
      `/subscriptions?user_id=eq.${user.sub}&select=stripe_customer_id&limit=1`
    )
    const existingCustomer = subRows?.[0]?.stripe_customer_id

    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY)
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'sek',
              unit_amount: PRICE_SEK_ORE,
              recurring: { interval: 'month' },
              product_data: {
                name: 'FormPlan Premium',
                description: 'Personligt tränings- och kostschema, AI-coach, fotoanalys m.m.',
              },
            },
          },
        ],
        subscription_data: { metadata: { supabase_user_id: user.sub } },
        metadata: { supabase_user_id: user.sub },
        // customer och customer_email är ömsesidigt uteslutande hos Stripe.
        ...(existingCustomer ? { customer: existingCustomer } : { customer_email: user.email }),
        allow_promotion_codes: true,
        success_url: `${base}/?billing=success`,
        cancel_url: `${base}/mer?billing=cancel`,
      })
      return c.json({ url: session.url })
    } catch (err) {
      console.error('Checkout failed:', err)
      return c.json({ error: 'Kunde inte starta betalningen' }, 502)
    }
  }
)

// POST /billing/portal — open the Stripe customer billing portal (manage/cancel).
billingRouter.post(
  '/portal',
  zValidator('json', z.object({ origin: z.string().url().optional() }), validationHook),
  async (c) => {
    const user = c.get('user')
    const { origin } = c.req.valid('json')
    const base = origin ?? 'https://app.formplan.app'

    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json({ error: 'Betalning är inte tillgänglig just nu. Försök igen senare.' }, 503)
    }

    const db = supabaseAdmin(c.env)
    const { data } = await db.query<{ stripe_customer_id: string | null }[]>(
      `/subscriptions?user_id=eq.${user.sub}&select=stripe_customer_id&limit=1`
    )
    const customer = data?.[0]?.stripe_customer_id
    if (!customer) return c.json({ error: 'Ingen prenumeration hittades' }, 404)

    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY)
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer,
        return_url: `${base}/mer`,
      })
      return c.json({ url: session.url })
    } catch (err) {
      console.error('Billing portal failed:', err)
      return c.json({ error: 'Kunde inte öppna prenumerationshanteringen' }, 502)
    }
  }
)
