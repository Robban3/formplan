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
    return user
  } catch {
    return null
  }
}

// Stripe-statusar som ger premium. incomplete/past_due/unpaid/canceled ger
// INTE åtkomst även om premium_until råkar ligga i framtiden.
const PREMIUM_STATUSES = new Set(['active', 'trialing'])

export async function isUserPremium(userId: string, env: Env): Promise<boolean> {
  const db = supabaseAdmin(env)
  const { data } = await db.query<{ premium_until: string; status: string | null }[]>(
    `/subscriptions?user_id=eq.${userId}&select=premium_until,status&limit=1`
  )
  const row = data?.[0]
  if (!row) return false
  if (!row.status || !PREMIUM_STATUSES.has(row.status)) return false
  return new Date(row.premium_until) > new Date()
}
