import type { Env, JwtPayload } from './types'

export function supabaseAdmin(env: Env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env

  async function query<T = unknown>(
    path: string,
    options?: RequestInit
  ): Promise<{ data: T | null; error: string | null }> {
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
    return (await res.json()) as JwtPayload
  } catch {
    return null
  }
}

export async function isUserPremium(userId: string, env: Env): Promise<boolean> {
  const db = supabaseAdmin(env)
  const { data } = await db.query<{ premium_until: string }[]>(
    `/subscriptions?user_id=eq.${userId}&select=premium_until&limit=1`
  )
  if (!data || data.length === 0) return false
  const row = data[0]
  if (!row) return false
  return new Date(row.premium_until) > new Date()
}
