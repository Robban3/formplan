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

  const isSubscriptionEvent =
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  if (!isSubscriptionEvent) return c.json({ ok: true })

  const sub = event.data.object as Stripe.Subscription
  const userId = sub.metadata['supabase_user_id']
  if (!userId) return c.json({ ok: true })

  // Ordningsvakt: Stripe garanterar inte leveransordning. Utan denna kan en
  // försenad "updated" (active) återuppliva premium EFTER en "deleted".
  // event.created (unix-sekunder) jämförs mot senast tillämpade händelse.
  const eventCreatedMs = event.created * 1000
  const { data: existingRows, error: readErr } = await db.query<{ last_event_at: string | null }[]>(
    `/subscriptions?user_id=eq.${userId}&select=last_event_at&limit=1`
  )
  if (readErr) {
    console.error('stripe webhook: could not read subscription row:', readErr)
    // 500 → Stripe försöker igen senare.
    return c.json({ error: 'Databasfel' }, 500)
  }
  const lastEventAt = existingRows?.[0]?.last_event_at
  if (lastEventAt && Date.parse(lastEventAt) >= eventCreatedMs) {
    return c.json({ ok: true, ignored: 'stale_event' })
  }
  const lastEventIso = new Date(eventCreatedMs).toISOString()

  if (event.type === 'customer.subscription.deleted') {
    const { error } = await db.query('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        status: 'canceled',
        premium_until: new Date().toISOString(),
        last_event_at: lastEventIso,
      }),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    })
    if (error) {
      console.error('stripe webhook: could not persist cancellation:', error)
      return c.json({ error: 'Databasfel' }, 500)
    }
    return c.json({ ok: true })
  }

  // created/updated: förläng premium_until ENDAST för statusar som ger premium.
  // För incomplete/past_due/unpaid/canceled sparas statusen (så isUserPremium
  // nekar åtkomst) men premium förlängs inte.
  const grantsPremium = sub.status === 'active' || sub.status === 'trialing'

  // I Stripes Basil-API (SDK v17) ligger current_period_end på prenumerations-
  // posten, inte på toppnivån. Läs båda, fall tillbaka på +31 dagar.
  const itemPeriodEnd = (sub.items?.data?.[0] as { current_period_end?: number } | undefined)
    ?.current_period_end
  const periodEndSec = sub.current_period_end ?? itemPeriodEnd
  const periodEnd = typeof periodEndSec === 'number'
    ? periodEndSec * 1000
    : Date.now() + 31 * 86_400_000
  const premiumUntil = grantsPremium
    ? new Date(periodEnd).toISOString()
    : new Date().toISOString()

  const { error } = await db.query('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer as string,
      status: sub.status,
      premium_until: premiumUntil,
      last_event_at: lastEventIso,
    }),
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
  })
  if (error) {
    console.error('stripe webhook: could not persist subscription update:', error)
    return c.json({ error: 'Databasfel' }, 500)
  }

  return c.json({ ok: true })
})
