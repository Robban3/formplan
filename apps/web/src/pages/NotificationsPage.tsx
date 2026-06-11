import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '../components/ui/Icons'
import { useSettings } from '../hooks/useSettings'
import { settingsStore } from '../lib/settings'
import { toast } from '../lib/toast'

type PermState = 'default' | 'granted' | 'denied'

export function NotificationsPage() {
  const navigate = useNavigate()
  const settings = useSettings()
  const [permState, setPermState] = useState<PermState>(
    'Notification' in window ? (Notification.permission as PermState) : 'denied'
  )

  async function requestPermission() {
    if (!('Notification' in window)) {
      toast.error('Din webbläsare stöder inte notiser.')
      return
    }
    const result = await Notification.requestPermission()
    setPermState(result as PermState)
    if (result === 'granted') {
      settingsStore.set('notifications_enabled', true)
      new Notification('FormPlan', {
        body: 'Notiser är nu aktiverade! 💪',
        icon: '/logo.svg',
      })
    } else {
      settingsStore.set('notifications_enabled', false)
      toast.info('Du kan aktivera notiser i webbläsarens inställningar.')
    }
  }

  function sendTestNotification() {
    if (Notification.permission !== 'granted') return
    new Notification('FormPlan – Testnotis', {
      body: 'Det här är en testnotis från FormPlan.',
      icon: '/logo.svg',
    })
  }

  const rows = [
    {
      label: 'Påminnelser om pass',
      sub: 'Notis när det är dags att träna',
      key: 'notifications_enabled' as const,
    },
  ]

  return (
    <div className="px-5 pt-header pb-4">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Notiser</h1>
      <p className="text-stone-400 text-sm mb-6">Välj vilka notiser du vill ta emot.</p>

      {/* Permission banner */}
      {permState !== 'granted' && (
        <div className={`rounded-2xl p-4 mb-4 ${permState === 'denied' ? 'bg-red-50 border border-red-100' : 'bg-forest-50 border border-forest-100'}`}>
          {permState === 'denied' ? (
            <>
              <p className="font-semibold text-red-700 text-sm">Notiser blockerade</p>
              <p className="text-red-500 text-xs mt-0.5">Tillåt notiser för FormPlan i webbläsarens inställningar.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-forest-700 text-sm">Tillåt notiser för att fortsätta</p>
              <button
                onClick={requestPermission}
                className="mt-2 bg-forest-700 text-white text-sm font-medium px-4 py-2 rounded-xl"
              >
                Aktivera notiser
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden mb-4">
        {rows.map((row, i) => (
          <div
            key={row.key}
            className={`flex items-center justify-between px-4 py-4 ${i > 0 ? 'border-t border-stone-100' : ''}`}
          >
            <div>
              <p className="text-stone-800 font-medium">{row.label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{row.sub}</p>
            </div>
            <button
              disabled={permState !== 'granted'}
              onClick={() => settingsStore.set(row.key, !settings[row.key])}
              className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-40 ${
                settings[row.key] && permState === 'granted' ? 'bg-forest-700' : 'bg-stone-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings[row.key] && permState === 'granted' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {permState === 'granted' && (
        <button
          onClick={sendTestNotification}
          className="w-full py-3 border border-stone-200 rounded-xl text-sm text-stone-600 hover:border-forest-400 hover:text-forest-600 transition-colors"
        >
          Skicka testnotis
        </button>
      )}
    </div>
  )
}
