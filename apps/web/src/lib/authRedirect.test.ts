import { describe, it, expect, vi, beforeEach } from 'vitest'

const isNativePlatform = vi.fn()
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform } }))

const open = vi.fn()
const close = vi.fn()
vi.mock('@capacitor/browser', () => ({ Browser: { open, close } }))

vi.stubGlobal('window', { location: { origin: 'https://app.formplan.app' } })

const {
  authRedirectUrl,
  isNativeApp,
  openExternalAuth,
  closeExternalAuth,
  NATIVE_AUTH_REDIRECT,
  UNIVERSAL_AUTH_REDIRECT,
} = await import('./authRedirect')

beforeEach(() => {
  isNativePlatform.mockReset()
  open.mockReset().mockResolvedValue(undefined)
  close.mockReset().mockResolvedValue(undefined)
})

describe('authRedirectUrl', () => {
  it('använder sidans egen adress på webben', () => {
    isNativePlatform.mockReturnValue(false)
    expect(authRedirectUrl()).toBe('https://app.formplan.app/auth')
    expect(isNativeApp()).toBe(false)
  })

  // Native pekar på https-adressen, inte på schemat: samma länk ska fungera
  // både på telefonen och på en dator. Pekade den på schemat brändes
  // engångstoken utan att något hände när mejlet öppnades på en dator.
  it('använder Universal Link i native, inte appens schema', () => {
    isNativePlatform.mockReturnValue(true)
    expect(authRedirectUrl()).toBe(UNIVERSAL_AUTH_REDIRECT)
    expect(authRedirectUrl()).not.toBe(NATIVE_AUTH_REDIRECT)
  })

  // Adresserna måste matcha det som ligger i Supabase Redirect URLs och i
  // apple-app-site-association. Ändras de här måste båda ändras med.
  it('håller adresserna oförändrade', () => {
    expect(NATIVE_AUTH_REDIRECT).toBe('app.formplan.app://auth')
    expect(UNIVERSAL_AUTH_REDIRECT).toBe('https://app.formplan.app/auth')
  })
})

describe('extern webbläsare för Google-inloggning', () => {
  // Google blockerar OAuth i inbäddade WebViews, så flödet måste ut i
  // systemets webbläsare.
  it('öppnar adressen i systemets webbläsare', async () => {
    await openExternalAuth('https://accounts.google.com/o/oauth2/auth?x=1')
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://accounts.google.com/o/oauth2/auth?x=1' })
    )
  })

  it('stänger fliken i native', async () => {
    isNativePlatform.mockReturnValue(true)
    await closeExternalAuth()
    expect(close).toHaveBeenCalled()
  })

  it('rör inte webbläsaren på webben', async () => {
    isNativePlatform.mockReturnValue(false)
    await closeExternalAuth()
    expect(close).not.toHaveBeenCalled()
  })

  // Stängningen sker efter att deep linken tagits emot. Finns ingen flik öppen
  // kastar plugin:et — och det får inte avbryta inloggningen som just lyckats.
  it('sväljer fel när ingen flik är öppen', async () => {
    isNativePlatform.mockReturnValue(true)
    close.mockRejectedValue(new Error('No browser to close'))
    await expect(closeExternalAuth()).resolves.toBeUndefined()
  })
})
