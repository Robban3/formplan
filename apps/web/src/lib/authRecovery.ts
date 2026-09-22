import { supabase } from './supabase'

/**
 * Lösenordsåterställning ger användaren en *inloggad* session redan när länken
 * öppnas. Utan den här modulen skulle appen då direkt skicka vidare till /hem,
 * och formuläret för att sätta ett nytt lösenord hann aldrig visas.
 *
 * Tre lägen, inte en boolean — skillnaden är en säkerhetsgräns:
 *
 *  - 'pending'  Adressen bar Supabases `type=recovery` i hashen. Det håller
 *               /auth kvar medan auth-js verifierar länken, men det får INTE
 *               räcka för att visa lösenordsformuläret: markören är bara text i
 *               adressfältet. Tidigare lästes den dessutom ur query-strängen,
 *               så vem som helst med en upplåst enhet kunde skriva
 *               `/auth?type=recovery` och sätta ett nytt lösenord på den redan
 *               inloggade sessionen — utan mejl, utan gammalt lösenord. För
 *               konton skapade med Google eller magisk länk (som saknar
 *               lösenord) skapade det ett helt nytt sätt att logga in.
 *  - 'active'   `PASSWORD_RECOVERY` har faktiskt kommit från auth-js. Först nu
 *               får formuläret visas.
 *  - 'none'     Ingen återställning pågår.
 *
 * Lyssnaren ligger på modulnivå, inte i AuthPage: händelsen kommer en tick
 * efter att sessionen sparats, och AuthPage kan redan ha avmonterats av
 * redirecten till /hem. Med lyssnaren här är den armad oavsett vilken vy som
 * råkar vara monterad.
 */

export type RecoveryState = 'none' | 'pending' | 'active'

/** Hur länge 'pending' får hålla /auth kvar innan vi ger upp på länken. */
const PENDING_TIMEOUT_MS = 15_000

function hasRecoveryMarker(): boolean {
  if (typeof window === 'undefined') return false
  // Enbart hashen. Supabases implicit-flöde lägger `type=recovery` där, och
  // hashen kan inte sättas av en länk någon annanstans i appen på samma sätt
  // som en query-parameter kan.
  return /(^|[#&])type=recovery(&|$)/.test(window.location.hash)
}

let state: RecoveryState = hasRecoveryMarker() ? 'pending' : 'none'
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function setState(next: RecoveryState) {
  if (state === next) return
  state = next
  emit()
}

export function getRecoveryState(): RecoveryState {
  return state
}

/** Sant så länge /auth ska hållas kvar (verifiering pågår eller formuläret visas). */
export function isPasswordRecovery(): boolean {
  return state !== 'none'
}

/** Sant först när `PASSWORD_RECOVERY` bekräftats — då får formuläret visas. */
export function isRecoveryConfirmed(): boolean {
  return state === 'active'
}

/** Avslutar återställningen (klar, avbruten eller utgången länk). */
export function endPasswordRecovery() {
  setState('none')
}

/**
 * Armar återställningen från native-appens deep link.
 *
 * I native finns ingen adress för auth-js att läsa, så `PASSWORD_RECOVERY`
 * kommer aldrig — länken växlas i stället in manuellt med `setSession`, som
 * ger SIGNED_IN. Anropas ENDAST av `nativeAuthLinks` och ENDAST efter att den
 * växlingen lyckats: token:et i länken är då beviset, exakt som händelsen är
 * det på webben. Anropa aldrig utifrån en markör i en adress — det var precis
 * så `/auth?type=recovery` kunde byta lösenord på en redan inloggad session.
 */
export function beginPasswordRecoveryFromVerifiedLink() {
  setState('active')
}

export function subscribePasswordRecovery(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') setState('active')
  })

  // Kom händelsen aldrig (utgången eller redan använd länk) får användaren inte
  // bli fast på /auth — släpp igenom till appen igen.
  if (state === 'pending') {
    window.setTimeout(() => {
      if (state === 'pending') setState('none')
    }, PENDING_TIMEOUT_MS)
  }
}
