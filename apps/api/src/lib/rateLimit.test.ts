import { describe, it, expect, beforeEach } from 'vitest'
import { consumeRateLimit, resetRateLimits } from './rateLimit'

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
