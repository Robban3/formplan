import { describe, it, expect, beforeEach } from 'vitest'
import { consumeRateLimit, consumeRateLimitKV, resetRateLimits } from './rateLimit'
import { createMockKV } from './kvMock'

const HOUR = 60 * 60 * 1000

describe('consumeRateLimit', () => {
  beforeEach(() => resetRateLimits())

  it('allows up to max requests in a window, then blocks', () => {
    const now = 1_000_000
    for (let i = 0; i < 3; i++) {
      expect(consumeRateLimit('plan:user1', 3, HOUR, now).allowed).toBe(true)
    }
    const blocked = consumeRateLimit('plan:user1', 3, HOUR, now + 1000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets after the window expires', () => {
    const now = 1_000_000
    for (let i = 0; i < 3; i++) consumeRateLimit('plan:user1', 3, HOUR, now)
    expect(consumeRateLimit('plan:user1', 3, HOUR, now).allowed).toBe(false)
    expect(consumeRateLimit('plan:user1', 3, HOUR, now + HOUR + 1).allowed).toBe(true)
  })

  it('tracks keys independently', () => {
    const now = 1_000_000
    for (let i = 0; i < 3; i++) consumeRateLimit('plan:user1', 3, HOUR, now)
    expect(consumeRateLimit('plan:user1', 3, HOUR, now).allowed).toBe(false)
    expect(consumeRateLimit('plan:user2', 3, HOUR, now).allowed).toBe(true)
    expect(consumeRateLimit('coach:user1', 20, HOUR, now).allowed).toBe(true)
  })
})

// KV-varianten kördes tidigare aldrig i testerna (testmiljön saknade
// RATE_LIMIT_KV, så allt föll tillbaka på in-memory-varianten ovan).
describe('consumeRateLimitKV', () => {
  const now = 1_700_000_000_000

  it('allows up to max requests in a window, then blocks', async () => {
    const { kv } = createMockKV()
    for (let i = 0; i < 3; i++) {
      expect((await consumeRateLimitKV(kv, 'plan:user1', 3, HOUR, now)).allowed).toBe(true)
    }
    const blocked = await consumeRateLimitKV(kv, 'plan:user1', 3, HOUR, now + 1000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets in the next window and tracks keys independently', async () => {
    const { kv } = createMockKV()
    for (let i = 0; i < 3; i++) await consumeRateLimitKV(kv, 'plan:user1', 3, HOUR, now)
    expect((await consumeRateLimitKV(kv, 'plan:user1', 3, HOUR, now)).allowed).toBe(false)
    expect((await consumeRateLimitKV(kv, 'plan:user2', 3, HOUR, now)).allowed).toBe(true)
    expect((await consumeRateLimitKV(kv, 'plan:user1', 3, HOUR, now + HOUR)).allowed).toBe(true)
  })

  // KV avvisar expirationTtl < 60 s. Utan golvet kastar kv.put ut ur
  // middlewaren och varje anrop på routen 500:ar.
  it('does not throw on a window shorter than the KV TTL minimum', async () => {
    const { kv, store } = createMockKV()
    await expect(consumeRateLimitKV(kv, 'plan:user1', 2, 30_000, now)).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    })
    expect(store.size).toBe(1)
  })

  // Ett korrupt värde gav NaN, och `NaN >= max` är false ⇒ limitern släppte
  // igenom allt resten av fönstret (fail-open).
  it('treats a corrupt counter as zero instead of failing open', async () => {
    const windowStart = Math.floor(now / HOUR) * HOUR
    for (const garbage of ['not-a-number', '', 'NaN', '-5']) {
      const mock = createMockKV()
      mock.seed(`rl:plan:user1:${windowStart}`, garbage)
      expect((await consumeRateLimitKV(mock.kv, 'plan:user1', 2, HOUR, now)).allowed).toBe(true)
      expect((await consumeRateLimitKV(mock.kv, 'plan:user1', 2, HOUR, now)).allowed).toBe(true)
      // Räknaren måste ha börjat om på 0 — tredje anropet blockeras.
      expect(
        (await consumeRateLimitKV(mock.kv, 'plan:user1', 2, HOUR, now)).allowed,
        `garbage value ${JSON.stringify(garbage)} must not fail open`
      ).toBe(false)
    }
  })
})
