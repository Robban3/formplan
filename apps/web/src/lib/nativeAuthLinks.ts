import { App } from '@capacitor/app'
import { supabase } from './supabase'
import { isNativeApp, NATIVE_AUTH_SCHEME } from './authRedirect'
import { beginPasswordRecoveryFromVerifiedLink } from './authRecovery'

/**
 * Tar emot inloggningslänkar som öppnar native-appen.
 *
 * På webben landar Supabases svar i sidans adress och auth-js plockar upp det
 * själv vid start. I native finns ingen sådan adress: operativsystemet startar
 * appen med en URL (`app.formplan.app://auth#access_token=…`) och WebViewen står
 * kvar på `https://localhost`. Utan det här steget hände alltså ingenting alls
 * när användaren klickade i mejlet eller kom tillbaka från Google.
 *
 * Båda flödena hanteras:
 *  - implicit (Supabases standard) — tokens ligger i fragmentet
 *  - PKCE — en engångskod i query-strängen
 * så att ett byte av `flowType` i supabase.ts inte tyst gör inloggningen död igen.
 */

export type NativeAuthOutcome =
  | { kind: 'none' }
  | { kind: 'signed-in' }
  | { kind: 'recovery' }
  | { kind: 'error'; message: string }

function paramsFromUrl(url: string): URLSearchParams {
  const merged = new URLSearchParams()
  // Fragment först: implicit-flödets tokens ligger där.
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : ''
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0]! : ''
  for (const source of [query, hash]) {
    if (!source) continue
    for (const [k, v] of new URLSearchParams(source)) merged.set(k, v)
  }
  return merged
}

function describeError(params: URLSearchParams): string {
  const code = params.get('error_code')
  const description = params.get('error_description')
  if (code === 'otp_expired' || /expired|invalid/i.test(description ?? '')) {
    return 'Länken har gått ut eller är redan använd. Begär en ny.'
  }
  return description ?? 'Inloggningslänken kunde inte verifieras.'
}

/**
 * Växlar in en öppnad länk mot en session. Exporterad för test — appen anropar
 * `registerNativeAuthLinks`.
 */
export async function handleAuthUrl(url: string): Promise<NativeAuthOutcome> {
  if (!url.startsWith(`${NATIVE_AUTH_SCHEME}://`)) return { kind: 'none' }
  const params = paramsFromUrl(url)

  if (params.get('error') || params.get('error_code')) {
    return { kind: 'error', message: describeError(params) }
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const code = params.get('code')

  try {
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) return { kind: 'error', message: error.message }
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) return { kind: 'error', message: error.message }
    } else {
      // Länk till appen utan något att växla in — inget att göra.
      return { kind: 'none' }
    }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Okänt fel' }
  }

  // setSession/exchangeCodeForSession ger SIGNED_IN, inte PASSWORD_RECOVERY, så
  // återställningsläget måste sättas här. Det sker FÖRST efter att sessionen
  // växlats in — själva token:et är beviset på att användaren kom via ett
  // giltigt återställningsmejl, precis som PASSWORD_RECOVERY är det på webben.
  if (params.get('type') === 'recovery') {
    beginPasswordRecoveryFromVerifiedLink()
    return { kind: 'recovery' }
  }
  return { kind: 'signed-in' }
}

let registered = false

/**
 * Lyssnar på länkar som öppnar appen. Idempotent — StrictMode monterar effekter
 * två gånger i utveckling och får inte ge två lyssnare.
 */
export function registerNativeAuthLinks(onOutcome?: (outcome: NativeAuthOutcome) => void) {
  if (!isNativeApp() || registered) return
  registered = true

  void App.addListener('appUrlOpen', ({ url }) => {
    void handleAuthUrl(url).then((outcome) => {
      if (outcome.kind !== 'none') onOutcome?.(outcome)
    })
  })

  // Startades appen kallt AV länken hann lyssnaren ovan inte registreras innan
  // händelsen sändes — läs därför även den URL appen öppnades med.
  void App.getLaunchUrl()
    .then((launch) => {
      if (!launch?.url) return
      return handleAuthUrl(launch.url).then((outcome) => {
        if (outcome.kind !== 'none') onOutcome?.(outcome)
      })
    })
    .catch(() => {
      /* plugin saknas eller ingen startlänk — inget att göra */
    })
}
