import { useEffect, useState, type ReactNode } from 'react'
import { billingApi, type BillingStatus } from '../lib/billingApi'
import { PaywallPage } from '../pages/PaywallPage'

function Spinner() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

/**
 * Gates the authenticated app behind the 7-day trial / paid subscription.
 * Fails open on errors so a transient outage never bricks the app.
 */
export function BillingGate({ user, children }: { user: unknown; children: ReactNode }) {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }
    let cancelled = false

    const returningFromCheckout =
      new URLSearchParams(window.location.search).get('billing') === 'success'

    async function load(attempt = 0) {
      try {
        const s = await billingApi.getStatus()
        if (cancelled) return
        // Webhook may lag right after checkout — retry briefly before showing paywall.
        if (!s.access && returningFromCheckout && attempt < 4) {
          setTimeout(() => load(attempt + 1), 2000)
          return
        }
        setStatus(s)
        setChecking(false)
      } catch {
        if (cancelled) return
        setStatus(null) // fail open
        setChecking(false)
      }
    }

    setChecking(true)
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) return <>{children}</>
  if (checking) return <Spinner />
  if (status && !status.access) return <PaywallPage status={status} />
  return <>{children}</>
}
