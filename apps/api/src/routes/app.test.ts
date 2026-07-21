import { describe, it, expect, vi, afterEach } from 'vitest'
import { app } from '../index'

// The API routes hit Supabase and Anthropic. For unit-level tests we only verify
// the handler wiring and auth guard — not the Supabase responses.

const mockEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  ANTHROPIC_API_KEY: 'test-key',
  STRIPE_SECRET_KEY: 'test-key',
  STRIPE_WEBHOOK_SECRET: 'test-secret',
  RESEND_API_KEY: 'test-key',
  ENVIRONMENT: 'test',
}

describe('GET /health', () => {
  it('returns 200 ok:true without auth', async () => {
    const res = await app.request('/health', {}, mockEnv)
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })
})

describe('auth guard', () => {
  it('returns 401 for protected routes with no token', async () => {
    for (const path of ['/profile', '/plan/list', '/nutrition/log?date=2024-01-01', '/workout/sessions', '/measurements']) {
      const res = await app.request(path, {}, mockEnv)
      expect(res.status, `${path} should be 401`).toBe(401)
    }
  })

  it('returns 401 for malformed Bearer token', async () => {
    const res = await app.request('/profile', {
      headers: { Authorization: 'Bearer not-a-real-jwt' },
    }, mockEnv)
    // verifyJwt calls Supabase; since we're offline it will fail → 401
    expect(res.status).toBe(401)
  })
})

describe('server-side paywall (requireAccess)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Autentiserad användare vars provperiod gått ut och som saknar prenumeration:
  // GoTrue svarar med en gammal användare, PostgREST med tomma listor.
  function mockExpiredTrialUser() {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({ id: 'user-1', email: 'test@example.com', created_at: '2020-01-01T00:00:00Z' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
  }

  it('returns 402 on premium routers when trial expired and no subscription', async () => {
    mockExpiredTrialUser()
    for (const path of ['/nutrition/log?date=2024-01-01', '/workout/sessions', '/measurements', '/plan/list']) {
      const res = await app.request(path, { headers: { Authorization: 'Bearer token' } }, mockEnv)
      expect(res.status, `${path} should be 402`).toBe(402)
      const body = (await res.json()) as { code?: string }
      expect(body.code).toBe('premium_required')
    }
  })

  it('keeps /profile, /billing/status and /account reachable without premium', async () => {
    mockExpiredTrialUser()
    for (const path of ['/profile', '/billing/status']) {
      const res = await app.request(path, { headers: { Authorization: 'Bearer token' } }, mockEnv)
      expect(res.status, `${path} should not be paywalled`).toBe(200)
    }
    // DELETE /account går förbi paywallen (fetch-mocken raderar "lyckat").
    const res = await app.request('/account', { method: 'DELETE', headers: { Authorization: 'Bearer token' } }, mockEnv)
    expect(res.status, '/account delete should not be paywalled').toBe(200)
  })
})

describe('route registration', () => {
  it('returns 404 for unknown paths', async () => {
    const res = await app.request('/not-a-real-path', {}, mockEnv)
    expect(res.status).toBe(404)
  })

  it('no longer exposes /email/test-all', async () => {
    const res = await app.request('/email/test-all', { method: 'POST' }, mockEnv)
    expect(res.status).toBe(404)
  })
})

describe('CORS', () => {
  it('allows localhost origin outside production', async () => {
    const res = await app.request(
      '/health',
      { headers: { Origin: 'http://localhost:5173' } },
      { ...mockEnv, ENVIRONMENT: 'test' }
    )
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
  })

  it('rejects localhost origin in production', async () => {
    const res = await app.request(
      '/health',
      { headers: { Origin: 'http://localhost:5173' } },
      { ...mockEnv, ENVIRONMENT: 'production' }
    )
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('allows the production app origin', async () => {
    const res = await app.request(
      '/health',
      { headers: { Origin: 'https://app.formplan.app' } },
      { ...mockEnv, ENVIRONMENT: 'production' }
    )
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://app.formplan.app')
  })
})
