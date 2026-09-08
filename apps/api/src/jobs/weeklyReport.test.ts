import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendWeeklyReports } from './weeklyReport'
import { createMockKV } from '../lib/kvMock'
import type { Env } from '../lib/types'

// Samma sak som för trial-påminnelsen: dedupmarkören i KV kördes aldrig i
// testerna. Utan den skickas veckorapporten igen vid varje omkörning av cron:en
// (eller om GoTrue returnerar samma sida två gånger).

function baseEnv(kv?: KVNamespace): Env {
  return {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    ANTHROPIC_API_KEY: 'test-key',
    STRIPE_SECRET_KEY: 'test-key',
    STRIPE_WEBHOOK_SECRET: 'test-secret',
    RESEND_API_KEY: 'test-key',
    WEBHOOK_SECRET: 'test-secret',
    ENVIRONMENT: 'test',
    ...(kv ? { RATE_LIMIT_KV: kv } : {}),
  } as Env
}

function mockGoTrueAndResend(): { sent: string[] } {
  const sent: string[] = []
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/auth/v1/admin/users')) {
      const page = new URL(url).searchParams.get('page')
      const users =
        page === '1' ? [{ id: 'user-week', email: 'week@example.com', user_metadata: {} }] : []
      return new Response(JSON.stringify({ users }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.includes('/workout_session')) {
      // Ett genomfört pass ⇒ användaren ska få en rapport.
      return new Response(
        JSON.stringify([{ total_volume_kg: 1200, completed_at: new Date().toISOString() }]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (url.includes('api.resend.com')) {
      sent.push(url)
      return new Response(JSON.stringify({ id: 'email-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  return { sent }
}

describe('sendWeeklyReports KV dedup marker', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sends once per user and week, then skips on a re-run', async () => {
    const kv = createMockKV()
    const { sent } = mockGoTrueAndResend()

    await sendWeeklyReports(baseEnv(kv.kv))
    expect(sent).toHaveLength(1)
    expect([...kv.store.keys()].some((k) => k.startsWith('weekly_report:user-week:'))).toBe(true)

    await sendWeeklyReports(baseEnv(kv.kv))
    expect(sent).toHaveLength(1)
  })

  it('without KV a re-run sends again (no marker to stop it)', async () => {
    const { sent } = mockGoTrueAndResend()

    await sendWeeklyReports(baseEnv())
    await sendWeeklyReports(baseEnv())
    expect(sent).toHaveLength(2)
  })
})
