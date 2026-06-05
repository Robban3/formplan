import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '../components/ui/Icons'
import { useSettings } from '../hooks/useSettings'
import { settingsStore } from '../lib/settings'

interface ToggleItem {
  label: string
  sub: string
  key: 'dark_mode' | 'imperial' | 'auto_rest'
}

const TOGGLES: ToggleItem[] = [
  { label: 'Mörkt läge', sub: 'Byt till mörkt tema', key: 'dark_mode' },
  { label: 'Imperiala enheter', sub: 'Visa lbs / miles istället för kg / km', key: 'imperial' },
  { label: 'Automatisk vilatimer', sub: 'Starta vilatimer direkt efter ett klarat set', key: 'auto_rest' },
]

export function SettingsPage() {
  const navigate = useNavigate()
  const settings = useSettings()

  return (
    <div className="px-5 pt-12 pb-4">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Inställningar</h1>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {TOGGLES.map((row, i) => (
          <div
            key={row.key}
            className={`flex items-center justify-between px-4 py-4 ${i > 0 ? 'border-t border-stone-100' : ''}`}
          >
            <div>
              <p className="text-stone-800 font-medium">{row.label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{row.sub}</p>
            </div>
            <button
              onClick={() => settingsStore.set(row.key, !settings[row.key])}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings[row.key] ? 'bg-forest-600' : 'bg-stone-200'
              }`}
              aria-pressed={settings[row.key]}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings[row.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-stone-300 text-center mt-6">Inställningar sparas lokalt på enheten.</p>
    </div>
  )
}
