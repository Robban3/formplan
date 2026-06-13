import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import Stripe from 'stripe'
import { requireAuth } from '../middleware/auth'
import { isUserPremium } from '../lib/supabase'
import type { AppContext } from '../lib/types'

const TRIAL_DAYS = 7
const PRICE_SEK_ORE = 9900 // 99,00 kr/mån

export const billingRouter = new Hono<AppContext>()

billingRouter.use('*', requireAuth)

// GET /billing/status — access = within 7-day trial (from signup) OR active sub.
billingRouter.get('/status', async (c) => {
  const user = c.get('user')
  const premium = await isUserPremium(user.sub, c.env)

  const created = user.created_at ? new Date(user.created_at) : new Date()
  const trialEnd = new Date(created.getTime() + TRIAL_DAYS * 86_400_000)
  const now = new Date()
  const inTrial = now < trialEnd
  const trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86_400_000))

  return c.json({
    access: premium || inTrial,
    premium,
    inTrial: inTrial && !premium,
    trialEndsAt: trialEnd.toISOString(),
    trialDaysLeft: premium ? 0 : trialDaysLeft,
    price_sek: PRICE_SEK_ORE / 100,
  })
})

// POST /billing/checkout — start a Stripe Checkout session for 99 kr/month.
billingRouter.post(
  '/checkout',
  zValidator('json', z.object({ origin: z.string().url().optional() })),
  async (c) => {
    const user = c.get('user')
    const { origin } = c.req.valid('json')
    const base = origin ?? 'https://app.formplan.app'

    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json({ error: 'Billing not configured' }, 503)
    }

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
        customer_email: user.email,
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
