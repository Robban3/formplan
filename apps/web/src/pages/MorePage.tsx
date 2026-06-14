import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { billingApi, type BillingStatus } from '../lib/billingApi'
import { toast } from '../lib/toast'
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
} from '../components/ui/Icons'

type IconComponent = React.ComponentType<{ className?: string }>

const rows: { label: string; Icon: IconComponent; to: string }[] = [
  { label: 'Mina mål',          Icon: TargetIcon,      to: '/mer/mina-mal' },
  { label: 'Utmaningar',        Icon: TrophyIcon,      to: '/mer/utmaningar' },
  { label: 'AI-coach',          Icon: BotIcon,         to: '/mer/ai-coach' },
  { label: 'Kroppsmätningar',   Icon: BarChartIcon,    to: '/mer/matningar' },
  { label: 'Recept',            Icon: BookOpenIcon,    to: '/mer/recept' },
  { label: 'Profil',        Icon: UserIcon,        to: '/mer/profil' },
  { label: 'Inställningar', Icon: SettingsIcon,    to: '/mer/installningar' },
  { label: 'Notiser',       Icon: BellIcon,        to: '/mer/notiser' },
  { label: 'Påminnelser',   Icon: ClockIcon,       to: '/mer/paminnelser' },
  { label: 'Apple Health',  Icon: HeartIcon,       to: '/mer/apple-health' },
  { label: 'Hjälp & support', Icon: HelpCircleIcon, to: '/mer/hjalp' },
  { label: 'Om appen',      Icon: InfoIcon,        to: '/mer/om' },
]

export function MorePage() {
  const navigate = useNavigate()
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
      toast.error('Kunde inte starta betalningen')
      setBusy(false)
    }
  }

  async function managePortal() {
    setBusy(true)
    try {
      const { url } = await billingApi.openPortal()
      window.location.href = url
    } catch {
      toast.error('Kunde inte öppna prenumerationen')
      setBusy(false)
    }
  }

  return (
    <div className="px-5 pt-header pb-4">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Mer</h1>

      {billing && (
        <div className="bg-white rounded-2xl border border-stone-100 p-4 mb-4">
          {billing.premium ? (
            <>
              <p className="font-semibold text-stone-900">Premium aktivt ✓</p>
              <p className="text-xs text-stone-400 mt-0.5">Tack för att du stödjer FormPlan!</p>
              <button
                onClick={managePortal}
                disabled={busy}
                className="mt-3 w-full py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:border-forest-400 hover:text-forest-700 transition-colors disabled:opacity-60"
              >
                Hantera prenumeration
              </button>
            </>
          ) : billing.inTrial ? (
            <>
              <p className="font-semibold text-stone-900">Provperiod</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {billing.trialDaysLeft} {billing.trialDaysLeft === 1 ? 'dag' : 'dagar'} kvar gratis
              </p>
              <button
                onClick={upgrade}
                disabled={busy}
                className="mt-3 w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                Uppgradera till Premium – {billing.price_sek || 99} kr/mån
              </button>
            </>
          ) : (
            <>
              <p className="font-semibold text-stone-900">Provperioden är slut</p>
              <p className="text-xs text-stone-400 mt-0.5">Bli Premium för att fortsätta.</p>
              <button
                onClick={upgrade}
                disabled={busy}
                className="mt-3 w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                Bli Premium – {billing.price_sek || 99} kr/mån
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {rows.map((row, i) => (
          <button
            key={row.label}
            onClick={() => navigate(row.to)}
            className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-stone-50 transition-colors ${
              i > 0 ? 'border-t border-stone-100' : ''
            }`}
          >
            <row.Icon className="w-5 h-5 stroke-stone-400 flex-shrink-0" />
            <span className="flex-1 text-left text-stone-800 font-medium">{row.label}</span>
            <ChevronRightIcon className="w-4 h-4 stroke-stone-300" />
          </button>
        ))}
      </div>

      <button
        onClick={async () => { await supabase.auth.signOut(); window.location.href = '/auth' }}
        className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-4 mt-4"
      >
        <LogOutIcon className="w-4 h-4 stroke-red-500" />
        Logga ut
      </button>
    </div>
  )
}
