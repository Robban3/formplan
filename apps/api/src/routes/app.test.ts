import { describe, it, expect, vi, beforeEach } from 'vitest'
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
