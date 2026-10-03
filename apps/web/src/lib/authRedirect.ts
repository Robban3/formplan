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

/**
 * Webbadressen som ÄVEN öppnar appen (Universal Link / App Link).
 *
 * Det egna schemat ovan fungerar bara på telefonen. Öppnade användaren
 * återställningsmejlet på en dator följde webbläsaren länken, Supabase brände
 * engångstoken och försökte skicka vidare till en adress datorn inte känner
 * till — resultatet blev en tom sida OCH en förbrukad länk. Nästa klick på
 * telefonen sa då bara "ogiltig länk".
 *
 * Med en https-adress gäller samma länk överallt: iOS öppnar appen direkt när
 * domänen är kopplad (se public/.well-known/apple-app-site-association), och på
 * en dator öppnas webbversionen där återställningen också fungerar. Misslyckas
 * kopplingen av någon anledning hamnar användaren i webbappen i stället för i
 * ett dödläge — degraderingen är mjuk.
 */
export const UNIVERSAL_AUTH_ORIGIN = 'https://app.formplan.app'
export const UNIVERSAL_AUTH_REDIRECT = `${UNIVERSAL_AUTH_ORIGIN}/auth`

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

/** Redirect-URL för inloggningsflödena. */
export function authRedirectUrl(): string {
  return isNativeApp() ? UNIVERSAL_AUTH_REDIRECT : `${window.location.origin}/auth`
}

/**
 * Öppnar Googles inloggning i systemets webbläsare i stället för i appens
 * WebView.
 *
 * Google BLOCKERAR OAuth i inbäddade WebViews (policyn mot `disallowed_useragent`)
 * — och en Capacitor-app är just en WebView. `signInWithOAuth` navigerar som
 * standard den egna vyn dit, vilket gav Googles "Something went wrong, sign in
 * another way" i stället för en inloggningsruta. Det går inte att koda sig runt:
 * flödet måste ut i en riktig webbläsare.
 *
 * Custom Tabs (Android) och SFSafariViewController (iOS) räknas som riktiga
 * webbläsare av Google, delar systemets inloggning (så användaren oftast redan
 * är inloggad på sitt Google-konto) och kan skicka tillbaka till appens schema.
 * Fliken stängs av `nativeAuthLinks` när länken kommit tillbaka.
 */
export async function openExternalAuth(url: string): Promise<void> {
  const { Browser } = await import('@capacitor/browser')
  await Browser.open({ url, presentationStyle: 'popover' })
}

/** Stänger fliken ovan. Tyst no-op om ingen är öppen. */
export async function closeExternalAuth(): Promise<void> {
  if (!isNativeApp()) return
  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.close()
  } catch {
    /* ingen flik öppen — inget att stänga */
  }
}
