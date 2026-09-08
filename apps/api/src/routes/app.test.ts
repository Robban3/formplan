import { describe, it, expect, vi, afterEach } from 'vitest'
import { app } from '../index'
import { createMockKV } from '../lib/kvMock'

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
          JSON.stringify({
            id: 'user-1',
            email: 'test@example.com',
            created_at: '2020-01-01T00:00:00Z',
            // Bekräftad e-post → requireVerifiedEmail släpper igenom (annars 403).
            email_confirmed_at: '2020-01-01T00:00:00Z',
          }),
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

describe('isUserPremium fail-closed on persistent DB error (no cache)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Autentiserad användare med utgången provperiod där subscriptions-läsningen
  // (och retry) ger ett DB-fel (500) och ingen KV-cache finns. Ett läsfel får
  // ALDRIG blankt ge premium (betalväggsbypass) — utan senast känt värde ska
  // åtkomst NEKAS (402), inte beviljas.
  it('denies access (402) when the subscription read keeps failing and no cache exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            id: 'user-1',
            email: 'payer@example.com',
            created_at: '2020-01-01T00:00:00Z',
            email_confirmed_at: '2020-01-01T00:00:00Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      // Subscriptions-läsningen (och retry) misslyckas → fail-closed (ingen KV).
      if (url.includes('/subscriptions')) {
        return new Response('db down', { status: 500 })
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const res = await app.request('/plan/list', { headers: { Authorization: 'Bearer token' } }, mockEnv)
    expect(res.status).toBe(402)
    const body = (await res.json()) as { code?: string }
    expect(body.code).toBe('premium_required')
  })
})

// KV-vägarna (RATE_LIMIT_KV) kördes tidigare aldrig i testerna: mockEnv saknade
// bindningen, så allt föll tillbaka på in-memory-varianterna. Med en stubbad
// KVNamespace testas de på riktigt — inklusive premium-cachen och den
// distribuerade rate limitern.
describe('KV-backed paths (RATE_LIMIT_KV bound)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const HOUR = 60 * 60 * 1000
  const future = () => new Date(Date.now() + 30 * 86_400_000).toISOString()

  // Autentiserad användare med bekräftad e-post. `subscriptions` styrs per test.
  function mockUser(opts: {
    createdAt: string
    subscriptions: () => Response
    gemini?: () => Response
  }) {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            id: 'user-1',
            email: 'kv@example.com',
            created_at: opts.createdAt,
            email_confirmed_at: opts.createdAt,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      if (url.includes('/subscriptions')) return opts.subscriptions()
      if (url.includes('generativelanguage.googleapis.com') && opts.gemini) return opts.gemini()
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
  }

  const okSubscription = () =>
    new Response(JSON.stringify([{ premium_until: future(), status: 'active' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  it('isUserPremium writes the premium cache after a successful read', async () => {
    const kv = createMockKV()
    mockUser({ createdAt: '2020-01-01T00:00:00Z', subscriptions: okSubscription })

    const res = await app.request(
      '/plan/list',
      { headers: { Authorization: 'Bearer token' } },
      { ...mockEnv, RATE_LIMIT_KV: kv.kv }
    )
    expect(res.status).toBe(200)

    const cached = kv.store.get('premium_cache:user-1')
    expect(cached, 'premium cache should have been written').toBeDefined()
    expect(JSON.parse(cached!.value).v).toBe('1')
    // TTL måste sättas, annars ligger värdet kvar för evigt.
    expect(cached!.expiresAt).not.toBeNull()
  })

  it('serves the cached premium value when the subscription read keeps failing', async () => {
    const kv = createMockKV()
    kv.seed('premium_cache:user-1', JSON.stringify({ v: '1', exp: Date.now() + 30 * 60 * 1000 }))
    // Provperioden är slut (konto från 2020) ⇒ endast cachen kan ge åtkomst.
    mockUser({
      createdAt: '2020-01-01T00:00:00Z',
      subscriptions: () => new Response('db down', { status: 500 }),
    })

    const res = await app.request(
      '/plan/list',
      { headers: { Authorization: 'Bearer token' } },
      { ...mockEnv, RATE_LIMIT_KV: kv.kv }
    )
    expect(res.status).toBe(200)
  })

  it('fails closed (402) when the read fails and the cache is empty', async () => {
    const kv = createMockKV()
    mockUser({
      createdAt: '2020-01-01T00:00:00Z',
      subscriptions: () => new Response('db down', { status: 500 }),
    })

    const res = await app.request(
      '/plan/list',
      { headers: { Authorization: 'Bearer token' } },
      { ...mockEnv, RATE_LIMIT_KV: kv.kv }
    )
    expect(res.status).toBe(402)
    const body = (await res.json()) as { code?: string }
    expect(body.code).toBe('premium_required')
  })

  it('rate limits with the KV counter: last allowed request, then 429', async () => {
    const kv = createMockKV()
    // Aktiv provperiod (nyss skapad) + bekräftad e-post ⇒ igenom paywallen.
    mockUser({
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      subscriptions: () =>
        new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }),
      gemini: () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    { text: '{"name":"Ägg","kcal":150,"protein_g":13,"fat_g":10,"carbs_g":1}' },
                  ],
                },
                finishReason: 'STOP',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
    })

    // rateLimit('ai-estimate-meal', 30) i routes/ai.ts — starta på 29 så bara
    // en förfrågan ryms innan gränsen nås.
    const windowStart = Math.floor(Date.now() / HOUR) * HOUR
    kv.seed(`rl:ai-estimate-meal:user-1:${windowStart}`, '29')

    const env = {
      ...mockEnv,
      AI_PROVIDER: 'gemini',
      GEMINI_API_KEY: 'test-gemini-key',
      RATE_LIMIT_KV: kv.kv,
    }
    const call = () =>
      app.request(
        '/ai/estimate-meal',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'två ägg' }),
        },
        env
      )

    const allowed = await call()
    expect(allowed.status).toBe(200)

    const blocked = await call()
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0)
  })
})

describe('profile protein_goal', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts and persists protein_goal', async () => {
    let insertedBody: Record<string, unknown> | null = null
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            id: 'user-3',
            email: 'test@example.com',
            created_at: '2020-01-01T00:00:00Z',
            email_confirmed_at: '2020-01-01T00:00:00Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      if (url.includes('/fitness_profile') && init?.method === 'POST') {
        insertedBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return new Response(JSON.stringify([insertedBody]), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const res = await app.request(
      '/profile',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: 'build_muscle',
          level: 'intermediate',
          equipment: ['gym'],
          days_per_week: 4,
          allergies: [],
          calorie_goal: 2500,
          protein_goal: 180,
          age: 30,
          weight_kg: 80,
          height_cm: 180,
        }),
      },
      mockEnv
    )
    expect(res.status).toBe(200)
    expect(insertedBody).not.toBeNull()
    expect((insertedBody as Record<string, unknown> | null)?.protein_goal).toBe(180)
  })

  it('accepts an onboarding POST that omits protein_goal and calorie_goal', async () => {
    let insertedBody: Record<string, unknown> | null = null
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            id: 'user-4',
            email: 'newuser@example.com',
            created_at: '2020-01-01T00:00:00Z',
            email_confirmed_at: '2020-01-01T00:00:00Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      if (url.includes('/fitness_profile') && init?.method === 'POST') {
        insertedBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return new Response(JSON.stringify([insertedBody]), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const res = await app.request(
      '/profile',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
        // Onboarding-payloaden utelämnar protein_goal (och calorie_goal) helt.
        body: JSON.stringify({
          goal: 'lose_weight',
          level: 'beginner',
          equipment: ['bodyweight'],
          days_per_week: 3,
          allergies: [],
          age: 25,
          weight_kg: 70,
          height_cm: 175,
        }),
      },
      mockEnv
    )
    expect(res.status).toBe(200)
    expect(insertedBody).not.toBeNull()
    expect((insertedBody as Record<string, unknown> | null)).not.toHaveProperty('protein_goal')
  })

  it('rejects a non-positive protein_goal with 400', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            id: 'user-3',
            email: 'test@example.com',
            created_at: '2020-01-01T00:00:00Z',
            email_confirmed_at: '2020-01-01T00:00:00Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const res = await app.request(
      '/profile',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: 'build_muscle',
          level: 'intermediate',
          equipment: ['gym'],
          days_per_week: 4,
          allergies: [],
          calorie_goal: 2500,
          protein_goal: -5,
          age: 30,
          weight_kg: 80,
          height_cm: 180,
        }),
      },
      mockEnv
    )
    expect(res.status).toBe(400)
  })
})

describe('verified-email gate (requireVerifiedEmail)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Användare med aktiv provperiod (nyligen skapad) men OBEKRÄFTAD e-post.
  function mockUnverifiedTrialUser() {
    const recent = new Date(Date.now() - 86_400_000).toISOString()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/auth/v1/user')) {
        return new Response(
          // Inget email_confirmed_at ⇒ email_verified = false.
          JSON.stringify({ id: 'user-2', email: 'unverified@example.com', created_at: recent }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
  }

  it('returns 403 email_unverified on AI routes and /plan/generate for unconfirmed email', async () => {
    mockUnverifiedTrialUser()
    const targets: [string, RequestInit][] = [
      ['/ai/estimate-meal', { method: 'POST', body: JSON.stringify({ description: 'ägg' }) }],
      ['/plan/generate', { method: 'POST', body: JSON.stringify({}) }],
    ]
    for (const [path, init] of targets) {
      const res = await app.request(
        path,
        { ...init, headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' } },
        mockEnv
      )
      expect(res.status, `${path} should be 403`).toBe(403)
      const body = (await res.json()) as { code?: string }
      expect(body.code).toBe('email_unverified')
    }
  })

  it('does not gate non-AI premium routes on email confirmation', async () => {
    mockUnverifiedTrialUser()
    // /plan/list är premium men ska INTE kräva bekräftad e-post.
    const res = await app.request('/plan/list', { headers: { Authorization: 'Bearer token' } }, mockEnv)
    expect(res.status).not.toBe(403)
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
