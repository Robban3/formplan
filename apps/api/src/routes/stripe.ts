import { Hono } from 'hono'
import Stripe from 'stripe'
import { supabaseAdmin } from '../lib/supabase'
import type { Env } from '../lib/types'

export const stripeRouter = new Hono<{ Bindings: Env }>()

stripeRouter.post('/webhook', async (c) => {
  const body = await c.req.text()
  const sig = c.req.header('stripe-signature')
  if (!sig) return c.json({ error: 'Missing signature' }, 400)

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY)
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, c.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  const db = supabaseAdmin(c.env)

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata['supabase_user_id']
    if (!userId) return c.json({ ok: true })

    // I Stripes Basil-API (SDK v17) ligger current_period_end på prenumerations-
    // posten, inte på toppnivån. Läs båda, fall tillbaka på +31 dagar.
    const itemPeriodEnd = (sub.items?.data?.[0] as { current_period_end?: number } | undefined)
      ?.current_period_end
    const periodEndSec = sub.current_period_end ?? itemPeriodEnd
    const periodEnd = typeof periodEndSec === 'number'
      ? periodEndSec * 1000
      : Date.now() + 31 * 86_400_000
    const premiumUntil = new Date(periodEnd).toISOString()

    await db.query('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        status: sub.status,
        premium_until: premiumUntil,
      }),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    })
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata['supabase_user_id']
    if (!userId) return c.json({ ok: true })

    await db.query(`/subscriptions?user_id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'canceled', premium_until: new Date().toISOString() }),
    })
  }

  return c.json({ ok: true })
})
