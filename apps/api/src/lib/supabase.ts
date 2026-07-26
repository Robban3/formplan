import type { Env, JwtPayload } from './types'

export function supabaseAdmin(env: Env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env

  async function query<T = unknown>(
    path: string,
    options?: RequestInit
  ): Promise<{ data: T | null; error: string | null }> {
    // Never throw — network/parse errors are returned as { error } so callers
    // (and Promise.all sites like food search) degrade gracefully instead of 500.
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
        ...options,
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
          ...(options?.headers ?? {}),
        },
      })

      if (!res.ok) {
        const text = await res.text()
        return { data: null, error: text }
      }

      const text = await res.text()
      const data = text ? (JSON.parse(text) as T) : null
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }

  return { query }
}

export async function verifyJwt(token: string, env: Env): Promise<JwtPayload | null> {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) return null
    // GoTrue's /auth/v1/user returns the user id in `id`, but the rest of the
    // app reads `sub` (the JWT claim name). Normalise so `user.sub` is set.
    const user = (await res.json()) as JwtPayload & { id?: string }
    if (!user.sub && user.id) user.sub = user.id
    if (!user.sub) return null
    // GoTrue markerar bekräftad e-post via email_confirmed_at (confirmed_at som
    // fallback). Magic-link/OTP-användare får detta satt vid första inloggningen,
    // så vanliga användare räknas som verifierade — bara oskapade/obekräftade
    // konton (huvudsaklig AI-kostnadsmissbruksvektor) blockeras.
    user.email_verified = user.email_confirmed_at != null || user.confirmed_at != null
    return user
  } catch {
    return null
  }
}

// Stripe-statusar som ger premium. incomplete/past_due/unpaid/canceled ger
// INTE åtkomst även om premium_until råkar ligga i framtiden.
const PREMIUM_STATUSES = new Set(['active', 'trialing'])

// Senast kända premium-status cachas ~30 min i KV. Räcker för att hålla nyligen
// aktiva betalare upplåsta genom en kortvarig Supabase-störning, utan att ge
// gratisåtkomst till konton som aldrig varit premium.
const PREMIUM_CACHE_TTL_S = 30 * 60

export async function isUserPremium(userId: string, env: Env): Promise<boolean> {
  const db = supabaseAdmin(env)
  const path = `/subscriptions?user_id=eq.${userId}&select=premium_until,status&limit=1`
  const read = () =>
    db.query<{ premium_until: string; status: string | null }[]>(path)
  const kv = env.RATE_LIMIT_KV
  const cacheKey = `premium_cache:${userId}`

  // Ett läsfel får ALDRIG blankt ge premium (det vore en betalväggsbypass som
  // dessutom självförstärker lasten under en störning). Försök igen en gång
  // efter en kort jitter-fördröjning; håller felet i sig används senast kända
  // värde från KV om det finns, annars fail CLOSED (false).
  let { data, error } = await read()
  if (error) {
    console.error('isUserPremium: subscription-läsning misslyckades, försöker igen:', error)
    await new Promise((r) => setTimeout(r, 50 + Math.floor(Math.random() * 100)))
    ;({ data, error } = await read())
    if (error) {
      console.error('isUserPremium: läsning misslyckades igen — cache/fail-closed:', error)
      if (kv) {
        const cached = await kv.get(cacheKey)
        if (cached != null) return cached === '1'
      }
      return false
    }
  }

  const row = data?.[0]
  const premium =
    !!row &&
    !!row.status &&
    PREMIUM_STATUSES.has(row.status) &&
    new Date(row.premium_until) > new Date()

  // Lyckad läsning → uppdatera senast-känt-värde i KV (om KV finns).
  if (kv) {
    try {
      await kv.put(cacheKey, premium ? '1' : '0', { expirationTtl: PREMIUM_CACHE_TTL_S })
    } catch (e) {
      console.error('isUserPremium: kunde inte skriva premium-cache:', e)
    }
  }

  return premium
}
