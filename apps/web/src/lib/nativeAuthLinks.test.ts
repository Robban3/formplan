import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capacitors App-plugin finns inte i testmiljön (ingen native-bro).
vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn(), getLaunchUrl: vi.fn() },
}))

const setSession = vi.fn()
const exchangeCodeForSession = vi.fn()
vi.mock('./supabase', () => ({
  supabase: { auth: { setSession, exchangeCodeForSession } },
  supabaseConfigured: true,
}))

const { handleAuthUrl } = await import('./nativeAuthLinks')
const { getRecoveryState, endPasswordRecovery } = await import('./authRecovery')

const TOKENS = 'access_token=abc&refresh_token=def&expires_in=3600&token_type=bearer'

beforeEach(() => {
  setSession.mockReset().mockResolvedValue({ error: null })
  exchangeCodeForSession.mockReset().mockResolvedValue({ error: null })
  endPasswordRecovery()
})

describe('handleAuthUrl', () => {
  it('ignores URLs that are not the app scheme', async () => {
    expect(await handleAuthUrl('https://app.formplan.app/auth#' + TOKENS)).toEqual({ kind: 'none' })
    expect(setSession).not.toHaveBeenCalled()
  })

  it('exchanges implicit-flow tokens from the fragment', async () => {
    const outcome = await handleAuthUrl(`app.formplan.app://auth#${TOKENS}`)
    expect(setSession).toHaveBeenCalledWith({ access_token: 'abc', refresh_token: 'def' })
    expect(outcome).toEqual({ kind: 'signed-in' })
    // Ingen återställning ⇒ formuläret för nytt lösenord får inte armas.
    expect(getRecoveryState()).toBe('none')
  })

  // Byts flowType till pkce i supabase.ts kommer en kod i query-strängen i
  // stället. Hanteras båda vägarna, annars dör inloggningen tyst igen.
  it('exchanges a PKCE code from the query string', async () => {
    const outcome = await handleAuthUrl('app.formplan.app://auth?code=xyz')
    expect(exchangeCodeForSession).toHaveBeenCalledWith('xyz')
    expect(outcome).toEqual({ kind: 'signed-in' })
  })

  // PASSWORD_RECOVERY kommer aldrig i native (setSession ger SIGNED_IN), så
  // type=recovery i länken är det som armar formuläret — men FÖRST efter att
  // sessionen växlats in.
  it('arms password recovery only after the session exchange succeeds', async () => {
    const outcome = await handleAuthUrl(`app.formplan.app://auth#${TOKENS}&type=recovery`)
    expect(outcome).toEqual({ kind: 'recovery' })
    expect(getRecoveryState()).toBe('active')
  })

  it('does not arm recovery when the exchange fails', async () => {
    setSession.mockResolvedValue({ error: { message: 'Token has expired' } })
    const outcome = await handleAuthUrl(`app.formplan.app://auth#${TOKENS}&type=recovery`)
    expect(outcome.kind).toBe('error')
    expect(getRecoveryState()).toBe('none')
  })

  // En markör utan tokens får ALDRIG räcka — det var precis så /auth?type=recovery
  // kunde byta lösenord på en redan inloggad session.
  it('never arms recovery from the marker alone', async () => {
    const outcome = await handleAuthUrl('app.formplan.app://auth?type=recovery')
    expect(outcome).toEqual({ kind: 'none' })
    expect(getRecoveryState()).toBe('none')
    expect(setSession).not.toHaveBeenCalled()
  })

  it('translates an expired link into Swedish', async () => {
    const outcome = await handleAuthUrl(
      'app.formplan.app://auth#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    )
    expect(outcome).toEqual({
      kind: 'error',
      message: 'Länken har gått ut eller är redan använd. Begär en ny.',
    })
    expect(setSession).not.toHaveBeenCalled()
  })

  it('reports a thrown error instead of rejecting', async () => {
    setSession.mockRejectedValue(new Error('storage blocked'))
    const outcome = await handleAuthUrl(`app.formplan.app://auth#${TOKENS}`)
    expect(outcome).toEqual({ kind: 'error', message: 'storage blocked' })
  })
})
