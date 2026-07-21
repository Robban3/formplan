import { createMiddleware } from 'hono/factory'
import type { Env, JwtPayload } from './types'

// Per-user rate limiter for expensive endpoints (AI calls, plan generation).
//
// State is an in-memory fixed window per Worker-isolate. Cloudflare Workers
// har ingen delad state utan KV/Durable Objects, så detta är "best effort":
// en användare som hamrar samma isolate (det vanliga missbruksfallet) stoppas,
// medan gränsen i värsta fall blir N × antal isolates. Gott nog som skydd mot
// kostnadsspikar utan extra infrastruktur; byt till KV/DO om hårda garantier behövs.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function consumeRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now()
): { allowed: boolean; retryAfterSeconds: number } {
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }
  if (bucket.count >= max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }
  bucket.count++
  // Opportunistisk städning så mappen inte växer obegränsat i en långlivad isolate.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k)
  }
  return { allowed: true, retryAfterSeconds: 0 }
}

// Test helper — clears all rate-limit state.
export function resetRateLimits(): void {
  buckets.clear()
}

/**
 * Hono middleware: limit an authenticated user to `max` requests per window
 * (default 1 hour). Must run after requireAuth (reads the user it set).
 */
export function rateLimit(name: string, max: number, windowMs: number = 60 * 60 * 1000) {
  return createMiddleware<{ Bindings: Env; Variables: { user: JwtPayload } }>(async (c, next) => {
    const user = c.get('user')
    const { allowed, retryAfterSeconds } = consumeRateLimit(`${name}:${user.sub}`, max, windowMs)
    if (!allowed) {
      c.header('Retry-After', String(retryAfterSeconds))
      return c.json(
        { error: 'Du har nått gränsen för antal förfrågningar. Vänta en stund och försök igen.' },
        429
      )
    }
    await next()
  })
}
