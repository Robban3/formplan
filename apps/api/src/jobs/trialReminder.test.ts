import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendTrialReminders } from './trialReminder'
import { createMockKV } from '../lib/kvMock'
import type { Env } from '../lib/types'

// Cron-jobbens dedupmarkörer ligger i KV och kördes tidigare aldrig i testerna
// (ingen RATE_LIMIT_KV i testmiljön). Utan markören dubblas utskicket så fort
// cron:en körs om — det är precis vad den här sviten bevakar.

const DAY = 86_400_000

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

// En användare vars provperiod tar slut om ~2 dagar (inom både det breda
// KV-fönstret och det smala fallback-fönstret).
function mockGoTrueAndResend(): { sent: string[] } {
  const sent: string[] = []
  // Beräknas EN gång: jobbet läser klockan innan användarna hämtas, så ett
  // created_at som räknas ut per svar hamnar precis på fönstrets kant.
  // 5,5 dygn ligger tryggt inne i både [4, 6) (med KV) och [5, 6) (utan).
  const createdAt = new Date(Date.now() - 5.5 * DAY).toISOString()
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/auth/v1/admin/users')) {
      // Sida 1 har användaren, sida 2 är tom (loopens stoppvillkor).
      const page = new URL(url).searchParams.get('page')
      const users =
        page === '1'
          ? [
              {
                id: 'user-trial',
                email: 'trial@example.com',
                created_at: createdAt,
                user_metadata: { full_name: 'Trial Testsson' },
              },
            ]
          : []
      return new Response(JSON.stringify({ users }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.includes('api.resend.com')) {
      sent.push(url)
      return new Response(JSON.stringify({ id: 'email-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    // Inga prenumerationer ⇒ inte premium ⇒ påminnelsen ska skickas.
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  return { sent }
}

describe('sendTrialReminders KV dedup marker', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sends once and writes a marker that prevents a second send', async () => {
    const kv = createMockKV()
    const { sent } = mockGoTrueAndResend()

    await sendTrialReminders(baseEnv(kv.kv))
    expect(sent).toHaveLength(1)
    expect(kv.store.has('trial_reminder:user-trial')).toBe(true)

    // Cron körs om (eller GoTrue upprepar en sida) — markören ska stoppa det.
    await sendTrialReminders(baseEnv(kv.kv))
    expect(sent).toHaveLength(1)
  })

  it('sends again once the marker has expired', async () => {
    const kv = createMockKV()
    const { sent } = mockGoTrueAndResend()

    await sendTrialReminders(baseEnv(kv.kv))
    expect(sent).toHaveLength(1)

    // Markören har ~40 dygns TTL.
    kv.advance(41 * DAY)
    await sendTrialReminders(baseEnv(kv.kv))
    expect(sent).toHaveLength(2)
  })

  it('without KV there is no marker, so a re-run sends twice', async () => {
    const { sent } = mockGoTrueAndResend()

    await sendTrialReminders(baseEnv())
    await sendTrialReminders(baseEnv())
    expect(sent).toHaveLength(2)
  })
})
