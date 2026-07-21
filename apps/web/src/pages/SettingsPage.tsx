import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '../components/ui/Icons'
import { useSettings } from '../hooks/useSettings'
import { settingsStore, type AppSettings } from '../lib/settings'
import { toast } from '../lib/toast'

type BoolKey = {
  [K in keyof AppSettings]: AppSettings[K] extends boolean ? K : never
}[keyof AppSettings]

type NumberKey = {
  [K in keyof AppSettings]: AppSettings[K] extends number ? K : never
}[keyof AppSettings]

function Toggle({ label, sub, settingKey }: { label: string; sub: string; settingKey: BoolKey }) {
  const settings = useSettings()
  const on = settings[settingKey] as boolean
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex-1 mr-4">
        <p className="text-stone-800 font-medium text-sm">{label}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => settingsStore.set(settingKey, !on)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${on ? 'bg-forest-700' : 'bg-stone-200'}`}
        aria-pressed={on}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function NumberInput({ label, sub, settingKey, unit, min, max, step = 1 }: {
  label: string; sub: string; settingKey: NumberKey; unit: string; min: number; max: number; step?: number
}) {
  const settings = useSettings()
  const value = settings[settingKey] as number
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex-1 mr-4">
        <p className="text-stone-800 font-medium text-sm">{label}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (!isNaN(n) && n >= min && n <= max) settingsStore.set(settingKey, n)
          }}
          className="w-20 text-right bg-stone-100 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400"
        />
        <span className="text-xs text-stone-400 w-8">{unit}</span>
      </div>
    </div>
  )
}

function SelectInput({ label, sub, settingKey, options }: {
  label: string; sub: string; settingKey: NumberKey; options: { label: string; value: number }[]
}) {
  const settings = useSettings()
  const value = settings[settingKey] as number
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex-1 mr-4">
        <p className="text-stone-800 font-medium text-sm">{label}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => settingsStore.set(settingKey, Number(e.target.value))}
        className="bg-stone-100 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide px-1 mb-2">{title}</p>
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden divide-y divide-stone-100">
        {children}
      </div>
    </div>
  )
}

function NotificationToggle() {
  const settings = useSettings()
  const on = settings.notifications_enabled

  async function handleToggle() {
    if (on) {
      settingsStore.set('notifications_enabled', false)
      settingsStore.set('water_reminder', false)
      return
    }

    if (!('Notification' in window)) {
      toast.error('Din webbläsare stöder inte notifikationer.')
      return
    }

    if (Notification.permission === 'denied') {
      toast.error('Notifikationer är blockerade. Ändra i webbläsarens inställningar.')
      return
    }

    const result = await Notification.requestPermission()
    if (result === 'granted') {
      settingsStore.set('notifications_enabled', true)
      new Notification('FormPlan', { body: 'Notifikationer är aktiverade!' })
    } else {
      toast.error('Notifikationer nekades.')
    }
  }

  const permissionStatus = !('Notification' in window)
    ? 'stöds ej'
    : Notification.permission === 'denied'
    ? 'blockerade i webbläsaren'
    : null

  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex-1 mr-4">
        <p className="text-stone-800 font-medium text-sm">Aktivera notifikationer</p>
        <p className="text-xs text-stone-400 mt-0.5">
          {permissionStatus ?? 'Tillåt FormPlan att skicka påminnelser'}
        </p>
      </div>
      <button
        onClick={handleToggle}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${on ? 'bg-forest-700' : 'bg-stone-200'}`}
        aria-pressed={on}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function NotificationSection() {
  const settings = useSettings()
  return (
    <Section title="Notiser">
      <NotificationToggle />
      {settings.notifications_enabled && (
        <Toggle
          label="Vattenintag-påminnelse"
          sub="Påminn om att dricka vatten under dagen"
          settingKey="water_reminder"
        />
      )}
    </Section>
  )
}

const REST_OPTIONS = [
  { label: '30 sek', value: 30 },
  { label: '45 sek', value: 45 },
  { label: '60 sek', value: 60 },
  { label: '90 sek', value: 90 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
]

export function SettingsPage() {
  const navigate = useNavigate()

  return (
    <div className="pb-10">
      <div className="px-5 pt-header pb-4 bg-white border-b border-stone-100">
        <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
          Mer
        </button>
        <h1 className="text-2xl font-bold text-stone-900">Inställningar</h1>
      </div>

      <div className="px-5 mt-5 space-y-5">

        {/* "Mörkt läge" är dolt tills komponenterna har dark:-varianter —
            idag gör toggeln ingenting synbart och känns bara trasig. */}

        <Section title="Träning">
          <Toggle
            label="Automatisk vilatimer"
            sub="Starta vilatimer direkt efter ett klarat set"
            settingKey="auto_rest"
          />
          <SelectInput
            label="Standard vilatid"
            sub="Används om passet inte anger vila"
            settingKey="rest_seconds_default"
            options={REST_OPTIONS}
          />
          <Toggle
            label="Håll skärmen aktiv"
            sub="Förhindra att skärmen slocknar under träning"
            settingKey="keep_screen_on"
          />
        </Section>

        <Section title="Kost & hälsa">
          <NumberInput
            label="Dagligt kaloriintag"
            sub="Ditt energimål per dag"
            settingKey="calorie_goal"
            unit="kcal"
            min={500}
            max={6000}
            step={50}
          />
          <NumberInput
            label="Proteinmål"
            sub="Dagligt proteinintag"
            settingKey="protein_goal_g"
            unit="g"
            min={20}
            max={500}
            step={5}
          />
          <NumberInput
            label="Vattenmål"
            sub="Dagligt vätskeintag"
            settingKey="water_goal_ml"
            unit="ml"
            min={500}
            max={6000}
            step={250}
          />
        </Section>

        <NotificationSection />

        <Section title="Enheter">
          <Toggle
            label="Imperiala enheter"
            sub="Visa lbs / miles istället för kg / km"
            settingKey="imperial"
          />
        </Section>

      </div>

      <p className="text-xs text-stone-300 text-center mt-6 px-5">Inställningar sparas lokalt på din enhet.</p>
    </div>
  )
}
