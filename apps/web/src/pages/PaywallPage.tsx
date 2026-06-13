import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { billingApi, type BillingStatus } from '../lib/billingApi'
import { CheckIcon } from '../components/ui/Icons'

const FEATURES = [
  'Personligt tränings- & kostschema',
  'AI-coach som kan din data',
  'Automatisk progression',
  'Fotoanalys & streckkodsscanner',
  'AI-recept & smart inköpslista',
  'Veckorapporter & måluppföljning',
]

export function PaywallPage({ status }: { status: BillingStatus }) {
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
      setError('Kunde inte starta betalningen. Försök igen.')
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  return (
    <div className="min-h-[100dvh] bg-stone-900 text-white flex flex-col max-w-lg mx-auto">
      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="FormPlan" style={{ height: '120px', width: 'auto' }} />
        </div>

        <h1 className="text-2xl font-bold text-center">Din gratisperiod är slut</h1>
        <p className="text-stone-400 text-center mt-2 text-sm">
          Fortsätt med FormPlan Premium och behåll allt du byggt upp.
        </p>

        <div className="mt-7 bg-stone-800/80 border border-stone-700 rounded-2xl p-5">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-extrabold">{price}</span>
            <span className="text-stone-400 font-medium">kr/mån</span>
          </div>
          <p className="text-center text-xs text-stone-500 mt-1">Avsluta när du vill</p>

          <ul className="mt-5 space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-stone-200">
                <span className="w-5 h-5 rounded-full bg-forest-600 flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="w-3 h-3 stroke-white" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}

        <button
          onClick={subscribe}
          disabled={loading}
          className="mt-6 w-full bg-forest-600 hover:bg-forest-700 text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-60"
        >
          {loading ? 'Öppnar betalning…' : `Starta prenumeration – ${price} kr/mån`}
        </button>

        <button onClick={logout} className="mt-4 w-full text-stone-500 text-sm py-2">
          Logga ut
        </button>
      </div>
    </div>
  )
}
