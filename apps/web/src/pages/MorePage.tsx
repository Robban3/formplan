import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { billingApi, type BillingStatus } from '../lib/billingApi'
import { toast } from '../lib/toast'
import { clearLocalUserData } from '../lib/localData'
import { flushLocalWater } from '../lib/waterStore'
import { isNativeApp } from '../lib/authRedirect'
import { workoutApi } from '../lib/workoutApi'
import {
  UserIcon,
  SettingsIcon,
  BellIcon,
  ClockIcon,
  HeartIcon,
  HelpCircleIcon,
  InfoIcon,
  LogOutIcon,
  ChevronRightIcon,
  TargetIcon,
  BookOpenIcon,
  BarChartIcon,
  TrophyIcon,
  BotIcon,
  ShieldIcon,
} from '../components/ui/Icons'
import { useT } from '../hooks/useT'
import type { TextKey } from '../lib/i18n'

type IconComponent = React.ComponentType<{ className?: string }>

interface MoreRow {
  key: TextKey
  Icon: IconComponent
  to: string
  /**
   * Visas bara på webben. Apple Health-sidan förklarar att integrationen kräver
   * native-appen — i native-appen vore det en sida som lovar en funktion "i
   * appen" till någon som redan sitter i den. Apple avvisar rutinmässigt
   * platshållar- och "kommer snart"-innehåll (riktlinje 2.1), och en menypost
   * som leder till "finns inte här" är dålig UX oavsett granskning.
   */
  webOnly?: boolean
}

const rows: MoreRow[] = [
  { key: 'more.goals',        Icon: TargetIcon,     to: '/mer/mina-mal' },
  { key: 'more.challenges',   Icon: TrophyIcon,     to: '/mer/utmaningar' },
  { key: 'more.aiCoach',      Icon: BotIcon,        to: '/mer/ai-coach' },
  { key: 'more.measurements', Icon: BarChartIcon,   to: '/mer/matningar' },
  { key: 'more.recipes',      Icon: BookOpenIcon,   to: '/mer/recept' },
  { key: 'more.profile',      Icon: UserIcon,       to: '/mer/profil' },
  { key: 'more.settings',     Icon: SettingsIcon,   to: '/mer/installningar' },
  { key: 'more.notifications', Icon: BellIcon,      to: '/mer/notiser' },
  { key: 'more.reminders',    Icon: ClockIcon,      to: '/mer/paminnelser' },
  { key: 'more.appleHealth',  Icon: HeartIcon,      to: '/mer/apple-health', webOnly: true },
  { key: 'more.help',         Icon: HelpCircleIcon, to: '/mer/hjalp' },
  { key: 'more.about',        Icon: InfoIcon,       to: '/mer/om' },
  { key: 'more.privacy',      Icon: ShieldIcon,     to: '/integritet' },
]

export function MorePage() {
  const navigate = useNavigate()
  const { t } = useT()
  const visibleRows = rows.filter((r) => !(r.webOnly && isNativeApp()))
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    billingApi.getStatus().then(setBilling).catch(() => {})
  }, [])

  async function upgrade() {
    setBusy(true)
    try {
      const { url } = await billingApi.startCheckout()
      window.location.href = url
    } catch {
      toast.error(t('account.paymentFailed'))
      setBusy(false)
    }
  }

  async function managePortal() {
    setBusy(true)
    try {
      const { url } = await billingApi.openPortal()
      window.location.href = url
    } catch {
      toast.error(t('account.portalFailed'))
      setBusy(false)
    }
  }

  async function logout() {
    // Flush pending offline data first so a logout never discards unsynced
    // water/session rows. Do NOT clearLocalUserData() on a plain logout — that
    // would wipe local-only settings (auto_rest, water_goal_ml, imperial, …).
    // The uid-guard in useAuth purges only when a DIFFERENT user signs in.
    await flushLocalWater().catch(() => {})
    await workoutApi.flushLocalSessions().catch(() => {})
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  async function deleteAccount() {
    if (!confirm(t('account.deleteConfirm1'))) return
    if (!confirm(t('account.deleteConfirm2'))) return
    try {
      await api.deleteAccount()
      clearLocalUserData()
      await supabase.auth.signOut()
      toast.success(t('account.deleted'))
      window.location.href = '/auth'
    } catch {
      toast.error(t('account.deleteFailed'))
    }
  }

  return (
    <div className="px-5 pt-header pb-4">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6">{t('nav.more')}</h1>

      {billing && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4 mb-4">
          {billing.premium ? (
            <>
              <p className="font-semibold text-stone-900 dark:text-stone-100">{t('billing.premiumActive')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('billing.thanks')}</p>
              {/* Knappen visas bara när det finns en Stripe-prenumeration att
                  öppna portalen för. Premium kan också komma från ett konto med
                  permanent tillgång — då svarade portalen 404 och ett rött
                  felmeddelande lade sig över rutan som just sagt "Premium
                  aktivt". Bättre att inte lova något som inte finns. */}
              {/* Saknas fältet svarar ett API som inte hunnit deployas — fall
                  då tillbaka på premium. Hellre en knapp som kan ge 404 än en
                  betalande kund utan väg att säga upp i appen. */}
              {(billing.manageable ?? billing.premium) && (
                <button
                  onClick={managePortal}
                  disabled={busy}
                  className="mt-3 w-full py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-700 dark:text-stone-300 hover:border-forest-400 hover:text-forest-700 dark:hover:text-forest-300 transition-colors disabled:opacity-60"
                >
                  {t('billing.manage')}
                </button>
              )}
            </>
          ) : billing.inTrial ? (
            <>
              <p className="font-semibold text-stone-900 dark:text-stone-100">{t('billing.trial')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {t(billing.trialDaysLeft === 1 ? 'billing.trialLeftOne' : 'billing.trialLeftMany', {
                  days: billing.trialDaysLeft,
                })}
              </p>
              <button
                onClick={upgrade}
                disabled={busy}
                className="mt-3 w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {t('billing.upgradeCta', { price: billing.price_sek || 99 })}
              </button>
            </>
          ) : (
            <>
              <p className="font-semibold text-stone-900 dark:text-stone-100">{t('billing.trialOver')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('billing.becomePremiumHint')}</p>
              <button
                onClick={upgrade}
                disabled={busy}
                className="mt-3 w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {t('billing.becomePremiumCta', { price: billing.price_sek || 99 })}
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        {visibleRows.map((row, i) => (
          <button
            key={row.key}
            onClick={() => navigate(row.to)}
            className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${
              i > 0 ? 'border-t border-stone-200 dark:border-stone-700' : ''
            }`}
          >
            <row.Icon className="w-5 h-5 stroke-stone-500 dark:stroke-stone-400 flex-shrink-0" />
            <span className="flex-1 text-left text-stone-800 dark:text-stone-200 font-medium">{t(row.key)}</span>
            <ChevronRightIcon className="w-4 h-4 stroke-stone-300 dark:stroke-stone-600" />
          </button>
        ))}
      </div>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-4 mt-4"
      >
        <LogOutIcon className="w-4 h-4 stroke-red-500" />
        {t('account.signOut')}
      </button>

      <button
        onClick={deleteAccount}
        className="w-full text-center text-xs text-stone-500 dark:text-stone-400 underline py-2"
      >
        {t('account.delete')}
      </button>
    </div>
  )
}
