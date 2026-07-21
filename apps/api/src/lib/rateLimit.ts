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

// Distribuerad variant: en fast fönster-räknare i Cloudflare KV, delad över alla
// isolates/colos så gränsen håller globalt (till skillnad från in-memory ovan).
//
// Tradeoff: KV är eventuellt konsistent och tål ~1 skrivning/sek/nyckel. Två
// samtidiga anrop kan därför läsa samma count och båda släppas igenom (gränsen
// blir mjuk, inte hård). För dessa lågfrekventa AI-endpoints (tiotal/timme per
// användare) är det gott nog — poängen är att stoppa massmissbruk, inte att
// räkna exakt. Nyckeln får expirationTtl = fönstrets längd så gamla fönster
// städas automatiskt (KV kräver minst 60 s TTL, våra fönster är ≥ 1 timme).
export async function consumeRateLimitKV(
  kv: KVNamespace,
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now()
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const windowStart = Math.floor(now / windowMs) * windowMs
  const kvKey = `rl:${key}:${windowStart}`
  const { value } = await kv.getWithMetadata(kvKey)
  const count = value ? parseInt(value, 10) : 0
  if (count >= max) {
    const resetAt = windowStart + windowMs
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)) }
  }
  await kv.put(kvKey, String(count + 1), { expirationTtl: Math.ceil(windowMs / 1000) })
  return { allowed: true, retryAfterSeconds: 0 }
}

/**
 * Hono middleware: limit an authenticated user to `max` requests per window
 * (default 1 hour). Must run after requireAuth (reads the user it set).
 *
 * Om env.RATE_LIMIT_KV finns används den KV-baserade räknaren (delad över alla
 * isolates/colos). Saknas bindningen faller vi transparent tillbaka på den
 * in-memory-baserade per-isolate-limitern — inget går sönder på deploys som
 * inte provisionerat KV. Signaturen är oförändrad så alla anropsplatser fungerar.
 */
export function rateLimit(name: string, max: number, windowMs: number = 60 * 60 * 1000) {
  return createMiddleware<{ Bindings: Env; Variables: { user: JwtPayload } }>(async (c, next) => {
    const user = c.get('user')
    const key = `${name}:${user.sub}`
    const { allowed, retryAfterSeconds } = c.env.RATE_LIMIT_KV
      ? await consumeRateLimitKV(c.env.RATE_LIMIT_KV, key, max, windowMs)
      : consumeRateLimit(key, max, windowMs)
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
