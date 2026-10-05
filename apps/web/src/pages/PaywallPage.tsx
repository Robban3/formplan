import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { billingApi, type BillingStatus } from '../lib/billingApi'
import { flushLocalWater } from '../lib/waterStore'
import { workoutApi } from '../lib/workoutApi'
import { CheckIcon } from '../components/ui/Icons'
import { useT } from '../hooks/useT'
import type { TextKey } from '../lib/i18n'

const FEATURE_KEYS: TextKey[] = [
  'paywall.f1', 'paywall.f2', 'paywall.f3', 'paywall.f4', 'paywall.f5', 'paywall.f6',
]

export function PaywallPage({ status }: { status: BillingStatus }) {
  const { t } = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const price = status.price_sek || 99

  async function subscribe() {
    setLoading(true)
    setError(null)
    try {
      const { url } = await billingApi.startCheckout()
      window.location.href = url
    } catch {
      setError(t('paywall.paymentFailed'))
      setLoading(false)
    }
  }

  async function logout() {
    // Flush pending offline data before signing out (same as MorePage) so a
    // logout never discards unsynced water/session rows or local settings.
    await flushLocalWater().catch(() => {})
    await workoutApi.flushLocalSessions().catch(() => {})
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  return (
    <div className="min-h-[100dvh] safe-pt bg-stone-900 text-white flex flex-col max-w-lg mx-auto">
      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="FormPlan" style={{ height: '120px', width: 'auto' }} />
        </div>

        <h1 className="text-2xl font-bold text-center">{t('paywall.trialOver')}</h1>
        <p className="text-stone-500 dark:text-stone-400 text-center mt-2 text-sm">
          {t('paywall.keepEverything')}
        </p>

        <div className="mt-7 bg-stone-800/80 border border-stone-700 rounded-2xl p-5">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-extrabold">{price}</span>
            <span className="text-stone-500 dark:text-stone-400 font-medium">{t('paywall.currencyPerMonth')}</span>
          </div>
          <p className="text-center text-xs text-stone-500 dark:text-stone-400 mt-1">{t('paywall.cancelAnytime')}</p>

          <ul className="mt-5 space-y-2.5">
            {FEATURE_KEYS.map((featureKey) => (
              <li key={featureKey} className="flex items-center gap-3 text-sm text-stone-200">
                <span className="w-5 h-5 rounded-full bg-forest-700 flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="w-3 h-3 stroke-white" />
                </span>
                {t(featureKey)}
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}

        <button
          onClick={subscribe}
          disabled={loading}
          className="mt-6 w-full bg-forest-700 hover:bg-forest-800 text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-60"
        >
          {loading ? t('paywall.opening') : t('paywall.startSubscription', { price })}
        </button>

        <button onClick={logout} className="mt-4 w-full text-stone-500 dark:text-stone-400 text-sm py-2">
          {t('account.signOut')}
        </button>
      </div>
    </div>
  )
}
