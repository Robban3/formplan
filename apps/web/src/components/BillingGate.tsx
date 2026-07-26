import { useEffect, useState, type ReactNode } from 'react'
import { billingApi, type BillingStatus } from '../lib/billingApi'
import { PaywallPage } from '../pages/PaywallPage'

function Spinner() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-canvas">
      <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function RetryScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <p className="font-semibold text-stone-800">Kunde inte kontrollera ditt konto</p>
      <p className="text-sm text-stone-500 max-w-xs">
        Vi kunde inte nå servern. Kontrollera din anslutning och försök igen.
      </p>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold transition-colors"
      >
        Försök igen
      </button>
    </div>
  )
}

/**
 * Gates the authenticated app behind the 7-day trial / paid subscription.
 *
 * Fails CLOSED: the server enforces entitlement and 402s every gated action, so
 * showing the full app after a status-fetch failure would look "unlocked" while
 * every action errored. Instead we retry with a short backoff and then show a
 * retry screen. We also re-check when a 402 anywhere dispatches
 * `formplan:entitlement-changed` (e.g. a trial expiring mid-session).
 */
export function BillingGate({ user, children }: { user: unknown; children: ReactNode }) {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [checking, setChecking] = useState(true)
  const [failed, setFailed] = useState(false)
  // Bump to force the effect to re-run (retry button).
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }
    let cancelled = false

    const returningFromCheckout =
      new URLSearchParams(window.location.search).get('billing') === 'success'

    async function load(lagAttempt = 0, errorAttempt = 0) {
      try {
        const s = await billingApi.getStatus()
        if (cancelled) return
        // Webhook may lag right after checkout — retry briefly before showing paywall.
        if (!s.access && returningFromCheckout && lagAttempt < 4) {
          setTimeout(() => load(lagAttempt + 1, errorAttempt), 2000)
          return
        }
        setFailed(false)
        setStatus(s)
        setChecking(false)
      } catch {
        if (cancelled) return
        // Do NOT fail open. Retry a few times with a short backoff, then show a
        // retry screen rather than exposing gated UI the server will 402.
        if (errorAttempt < 3) {
          setTimeout(() => load(lagAttempt, errorAttempt + 1), 1000 * (errorAttempt + 1))
          return
        }
        setStatus(null)
        setFailed(true)
        setChecking(false)
      }
    }

    // Re-check entitlement without flashing the spinner when a 402 fires
    // mid-session — the paywall renders as soon as status shows no access.
    function recheck() {
      load()
    }

    setChecking(true)
    setFailed(false)
    load()

    window.addEventListener('formplan:entitlement-changed', recheck)
    return () => {
      cancelled = true
      window.removeEventListener('formplan:entitlement-changed', recheck)
    }
  }, [user, reloadKey])

  if (!user) return <>{children}</>
  if (checking) return <Spinner />
  if (failed) return <RetryScreen onRetry={() => setReloadKey((k) => k + 1)} />
  if (status && !status.access) return <PaywallPage status={status} />
  return <>{children}</>
}
