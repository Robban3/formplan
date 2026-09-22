import { Capacitor } from '@capacitor/core'

/**
 * Vart Supabase ska skicka tillbaka användaren efter magisk länk, Google och
 * lösenordsåterställning.
 *
 * På webben är det helt enkelt appens egen adress. I native-appen fungerar den
 * INTE: Capacitor kör WebViewen på `https://localhost`, så en länk dit öppnar
 * ingenting — den adressen finns inte utanför WebViewen. Följden var att både
 * "Fortsätt med Google", magisk länk och "Glömt lösenord?" var döda knappar i
 * den installerade appen; bara e-post + lösenord fungerade.
 *
 * Native använder därför appens egna URL-schema, som operativsystemet vet hör
 * till FormPlan (registrerat i AndroidManifest.xml och i iOS Info.plist).
 * Systemet startar appen, och `nativeAuthLinks` växlar in tokens i länken mot
 * en session.
 *
 * VIKTIGT: adressen nedan måste också ligga i Supabase under
 * Authentication → URL Configuration → Redirect URLs, annars vägrar GoTrue
 * skicka användaren hit och faller tillbaka på projektets Site URL.
 */
export const NATIVE_AUTH_SCHEME = 'app.formplan.app'
export const NATIVE_AUTH_REDIRECT = `${NATIVE_AUTH_SCHEME}://auth`

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

/** Redirect-URL för inloggningsflödena — schema i native, origin på webben. */
export function authRedirectUrl(): string {
  return isNativeApp() ? NATIVE_AUTH_REDIRECT : `${window.location.origin}/auth`
}
