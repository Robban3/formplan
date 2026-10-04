import { describe, it, expect, vi, beforeEach } from 'vitest'

const isUserPremium = vi.fn()
vi.mock('./supabase', () => ({ isUserPremium }))

const { resolveAccess, FULL_ACCESS_EMAILS, TRIAL_DAYS } = await import('./access')

const env = {} as never

/** Env med bara det testet behöver. `{} as never` går inte att sprida. */
function envWith(overrides: Record<string, string | undefined>) {
  return overrides as never
}
const DAY = 86_400_000

function user(overrides: Record<string, unknown> = {}) {
  return {
    sub: 'user-1',
    email: 'någon@example.com',
    created_at: new Date(Date.now() - 1 * DAY).toISOString(),
    ...overrides,
  } as never
}

beforeEach(() => isUserPremium.mockReset().mockResolvedValue(false))

describe('resolveAccess', () => {
  it('ger konton i listan full åtkomst utan att fråga Stripe', async () => {
    const status = await resolveAccess(user({ email: 'robert@applabbet.com' }), env)
    expect(status.access).toBe(true)
    expect(status.premium).toBe(true)
    expect(isUserPremium).not.toHaveBeenCalled()
  })

  // "Hantera prenumeration" öppnar Stripes kundportal. Ett konto i listan har
  // ingen Stripe-kund, så knappen gav 404 och ett rött fel över en ruta som
  // samtidigt sa "Premium aktivt".
  it('markerar listkonton som INTE hanterbara', async () => {
    for (const email of FULL_ACCESS_EMAILS) {
      const status = await resolveAccess(user({ email }), env)
      expect(status.manageable).toBe(false)
    }
  })

  it('matchar listan oberoende av versaler', async () => {
    const status = await resolveAccess(user({ email: 'Robert@Applabbet.com' }), env)
    expect(status.premium).toBe(true)
  })

  it('markerar en riktig prenumeration som hanterbar', async () => {
    isUserPremium.mockResolvedValue(true)
    const status = await resolveAccess(user(), env)
    expect(status.manageable).toBe(true)
    expect(status.inTrial).toBe(false)
  })

  it('ger provperiod till ett nytt konto, utan hanterbar prenumeration', async () => {
    const status = await resolveAccess(user(), env)
    expect(status.access).toBe(true)
    expect(status.inTrial).toBe(true)
    expect(status.manageable).toBe(false)
  })

  it('stänger ute den vars provperiod gått ut', async () => {
    const status = await resolveAccess(
      user({ created_at: new Date(Date.now() - (TRIAL_DAYS + 1) * DAY).toISOString() }),
      env
    )
    expect(status.access).toBe(false)
    expect(status.trialDaysLeft).toBe(0)
  })

  // Utan registreringsdatum går det inte att räkna ut när provperioden tar
  // slut — då får den inte bli oändlig.
  it('ger ingen provperiod när registreringsdatum saknas', async () => {
    const status = await resolveAccess(user({ created_at: undefined }), env)
    expect(status.access).toBe(false)
    expect(status.inTrial).toBe(false)
  })
})

/**
 * Testarna ligger i env, inte i koden. De här testen håller fast att
 * variabeln faktiskt läses, att den är valfri, och att en tom lista inte
 * råkar ge alla åtkomst.
 */
describe('TESTER_EMAILS', () => {
  it('ger permanent åtkomst till en adress i listan', async () => {
    const status = await resolveAccess(
      user({ email: 'tester@example.com', created_at: new Date(Date.now() - 99 * DAY).toISOString() }),
      envWith({ TESTER_EMAILS: 'tester@example.com' })
    )
    expect(status.access).toBe(true)
    expect(status.premium).toBe(true)
    // Ingen Stripe-kund bakom, så ingen portal att öppna.
    expect(status.manageable).toBe(false)
  })

  it('bryr sig inte om versaler eller mellanslag', async () => {
    const status = await resolveAccess(
      user({ email: 'Tester@Example.com', created_at: new Date(Date.now() - 99 * DAY).toISOString() }),
      envWith({ TESTER_EMAILS: ' a@b.se , tester@example.com ' })
    )
    expect(status.access).toBe(true)
  })

  it('en tom lista ger ingen åtkomst', async () => {
    for (const value of ['', '   ', ',,', undefined]) {
      const status = await resolveAccess(
        user({ email: 'someone@example.com', created_at: new Date(Date.now() - 99 * DAY).toISOString() }),
        envWith({ TESTER_EMAILS: value })
      )
      expect(status.access, `TESTER_EMAILS=${JSON.stringify(value)}`).toBe(false)
    }
  })

  it('påverkar inte den fasta listan', async () => {
    const status = await resolveAccess(
      user({ email: 'review@applabbet.com', created_at: new Date(Date.now() - 99 * DAY).toISOString() }),
      envWith({ TESTER_EMAILS: '' })
    )
    expect(status.access).toBe(true)
  })
})
