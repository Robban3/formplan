import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon, XIcon } from '../components/ui/Icons'
import { useSettings } from '../hooks/useSettings'
import { settingsStore, type Reminder } from '../lib/settings'
import { toast } from '../lib/toast'

const DAY_LABELS = ['M', 'Ti', 'O', 'To', 'F', 'L', 'S']
const DAY_FULL = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

// Schedule a browser notification for the next occurrence of [days × time].
function scheduleNotification(r: Reminder) {
  if (Notification.permission !== 'granted') return

  const now = new Date()
  const [hh, mm] = r.time.split(':').map(Number)
  const nextOccurrence = r.days
    .map((day) => {
      const d = new Date(now)
      const diff = ((day - 1) - (now.getDay() === 0 ? 6 : now.getDay() - 1) + 7) % 7
      d.setDate(d.getDate() + diff)
      d.setHours(hh ?? 0, mm ?? 0, 0, 0)
      if (d <= now) d.setDate(d.getDate() + 7)
      return d
    })
    .sort((a, b) => a.getTime() - b.getTime())[0]

  if (!nextOccurrence) return

  const msUntil = nextOccurrence.getTime() - now.getTime()
  setTimeout(() => {
    if (Notification.permission !== 'granted') return
    new Notification(`FormPlan – ${r.label}`, {
      body: 'Dags att träna! Öppna appen för att komma igång.',
      icon: '/logo.svg',
    })
  }, msUntil)
}

export function RemindersPage() {
  const navigate = useNavigate()
  const settings = useSettings()
  const [adding, setAdding] = useState(false)
  const [newDays, setNewDays] = useState<number[]>([1, 3, 5])
  const [newTime, setNewTime] = useState('07:00')
  const [newLabel, setNewLabel] = useState('Träningspass')

  function toggleDay(day: number) {
    setNewDays((ds) =>
      ds.includes(day) ? ds.filter((d) => d !== day) : [...ds, day].sort()
    )
  }

  function addReminder() {
    if (newDays.length === 0) {
      toast.error('Välj minst en dag.')
      return
    }
    if (Notification.permission !== 'granted') {
      toast.error('Aktivera notiser under Notiser-sidan först.')
      return
    }
    const r = settingsStore.addReminder({ days: newDays, time: newTime, label: newLabel, enabled: true })
    scheduleNotification(r)
    setAdding(false)
    toast.success('Påminnelse skapad!')
  }

  function toggleReminder(id: string, enabled: boolean) {
    settingsStore.updateReminder(id, { enabled })
    if (enabled) {
      const r = settings.reminders.find((r) => r.id === id)
      if (r) scheduleNotification({ ...r, enabled: true })
    }
  }

  function removeReminder(id: string) {
    settingsStore.deleteReminder(id)
  }

  function formatDays(days: number[]) {
    if (days.length === 7) return 'Varje dag'
    if (days.length === 5 && !days.includes(6) && !days.includes(7)) return 'Vardagar'
    return days.map((d) => DAY_LABELS[d - 1]).join(', ')
  }

  return (
    <div className="px-5 pt-12 pb-4">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Påminnelser</h1>
      <p className="text-stone-400 text-sm mb-6">Schemalägg påminnelser om dina träningspass.</p>

      {settings.reminders.length === 0 && !adding && (
        <p className="text-stone-400 text-sm text-center py-8">Inga påminnelser ännu.</p>
      )}

      <div className="space-y-3 mb-4">
        {settings.reminders.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="font-semibold text-stone-800">{r.label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{formatDays(r.days)} · {r.time}</p>
            </div>
            <button
              onClick={() => toggleReminder(r.id, !r.enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${r.enabled ? 'bg-forest-600' : 'bg-stone-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${r.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <button onClick={() => removeReminder(r.id)} className="p-1">
              <XIcon className="w-4 h-4 stroke-stone-300" />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
          <label className="block">
            <span className="text-sm text-stone-500">Etikett</span>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="mt-1 w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400 text-sm"
            />
          </label>

          <div>
            <span className="text-sm text-stone-500">Dagar</span>
            <div className="flex gap-2 mt-2">
              {DAY_LABELS.map((label, i) => {
                const day = i + 1
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      newDays.includes(day) ? 'bg-forest-600 text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="block">
            <span className="text-sm text-stone-500">Tid</span>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="mt-1 w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400 text-sm"
            />
          </label>

          <div className="flex gap-3">
            <button
              onClick={() => setAdding(false)}
              className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-medium text-sm"
            >
              Avbryt
            </button>
            <button
              onClick={addReminder}
              className="flex-1 py-3 rounded-xl bg-forest-600 text-white font-semibold text-sm"
            >
              Spara
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-xl text-sm text-forest-600 font-medium hover:bg-forest-50 transition-colors"
        >
          <PlusIcon className="w-4 h-4 stroke-forest-600" />
          Ny påminnelse
        </button>
      )}

      <p className="text-xs text-stone-300 text-center mt-6">
        Påminnelser kräver att notiser är aktiverade och att appen är öppen.
      </p>
    </div>
  )
}
