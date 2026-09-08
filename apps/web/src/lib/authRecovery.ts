/**
 * Lösenordsåterställning ger användaren en *inloggad* session redan när länken
 * öppnas. Utan den här flaggan skulle appen då direkt skicka vidare till /hem,
 * och formuläret för att sätta ett nytt lösenord hann aldrig visas.
 *
 * Flaggan sätts på två sätt, som bälte och hängslen:
 *  1. direkt vid modulinläsning om adressen bär Supabases `type=recovery`
 *     (läses innan klienten hinner rensa hashen), och
 *  2. från `PASSWORD_RECOVERY`-händelsen i AuthPage.
 */

function hasRecoveryMarker(): boolean {
  if (typeof window === 'undefined') return false
  const { hash, search } = window.location
  return /(^|[#&?])type=recovery(&|$)/.test(hash) || /(^|[&?])type=recovery(&|$)/.test(search)
}

let recovering = hasRecoveryMarker()
const listeners = new Set<() => void>()

export function isPasswordRecovery(): boolean {
  return recovering
}

export function setPasswordRecovery(value: boolean) {
  if (recovering === value) return
  recovering = value
  for (const listener of listeners) listener()
}

export function subscribePasswordRecovery(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
