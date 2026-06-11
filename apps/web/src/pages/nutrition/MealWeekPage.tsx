import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon, XIcon } from '../../components/ui/Icons'

type MealSlot = 'frukost' | 'lunch' | 'middag' | 'mellanmar'
const SLOTS: MealSlot[] = ['frukost', 'lunch', 'middag', 'mellanmar']
const SLOT_LABELS: Record<MealSlot, string> = { frukost:'Frukost', lunch:'Lunch', middag:'Middag', mellanmar:'Mellanmål' }
const DAY_LABELS = ['Mån','Tis','Ons','Tor','Fre','Lör','Sön']
const KEY = 'formplan_meal_week'

type WeekPlan = Record<number, Record<MealSlot, string>> // weekday 1-7 → slot → meal name

function load(): WeekPlan {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as WeekPlan }
  catch { return {} }
}
function save(plan: WeekPlan) { localStorage.setItem(KEY, JSON.stringify(plan)) }

function todayWeekday() { const d = new Date().getDay(); return d === 0 ? 7 : d }

export function MealWeekPage() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<WeekPlan>(load)
  const [editing, setEditing] = useState<{ day: number; slot: MealSlot } | null>(null)
  const [input, setInput] = useState('')
  const today = todayWeekday()

  function getMeal(day: number, slot: MealSlot) {
    return plan[day]?.[slot] ?? ''
  }

  function setMeal(day: number, slot: MealSlot, value: string) {
    const updated = { ...plan, [day]: { ...(plan[day] ?? {}), [slot]: value } as Record<MealSlot, string> }
    setPlan(updated)
    save(updated)
  }

  function clearMeal(day: number, slot: MealSlot) {
    const updated = { ...plan, [day]: { ...(plan[day] ?? {}), [slot]: '' } as Record<MealSlot, string> }
    setPlan(updated)
    save(updated)
  }

  function openEdit(day: number, slot: MealSlot) {
    setEditing({ day, slot })
    setInput(getMeal(day, slot))
  }

  function saveEdit() {
    if (!editing) return
    setMeal(editing.day, editing.slot, input.trim())
    setEditing(null)
    setInput('')
  }

  return (
    <div className="pb-10">
      <div className="px-5 pt-header pb-4 bg-white border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
          Kost
        </button>
        <h1 className="text-2xl font-bold text-stone-900">Veckoplanering</h1>
        <p className="text-sm text-stone-400 mt-0.5">Planera dina måltider för hela veckan</p>
      </div>

      <div className="mt-4 overflow-x-auto scrollbar-hide">
        <div className="px-5 min-w-[600px]">
          {/* Header row */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="text-xs text-stone-400 font-medium" />
            {DAY_LABELS.map((d, i) => (
              <div key={d} className={`text-center text-xs font-semibold rounded-lg py-1.5 ${
                i + 1 === today ? 'bg-forest-700 text-white' : 'text-stone-500'
              }`}>
                {d}
              </div>
            ))}
          </div>

          {/* Meal rows */}
          {SLOTS.map((slot) => (
            <div key={slot} className="grid grid-cols-8 gap-1 mb-2">
              <div className="flex items-center text-xs text-stone-400 font-medium pr-1">
                {SLOT_LABELS[slot]}
              </div>
              {[1,2,3,4,5,6,7].map((day) => {
                const meal = getMeal(day, slot)
                const isToday = day === today
                return (
                  <button
                    key={day}
                    onClick={() => openEdit(day, slot)}
                    className={`rounded-xl p-1.5 text-left min-h-[52px] border transition-colors ${
                      isToday
                        ? 'border-forest-200 bg-forest-50 hover:bg-forest-100'
                        : 'border-stone-100 bg-white hover:bg-stone-50'
                    }`}
                  >
                    {meal ? (
                      <p className="text-[10px] font-medium text-stone-700 leading-tight">{meal}</p>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <PlusIcon className="w-3 h-3 stroke-stone-300" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 mt-4 flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-forest-700" />
        <span className="text-xs text-stone-400">Idag</span>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900">
                {DAY_LABELS[editing.day - 1]} · {SLOT_LABELS[editing.slot]}
              </h3>
              <button onClick={() => setEditing(null)}>
                <XIcon className="w-5 h-5 stroke-stone-400" />
              </button>
            </div>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              placeholder="t.ex. Kycklingwok med ris"
              className="w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400"
            />
            <div className="flex gap-3">
              {getMeal(editing.day, editing.slot) && (
                <button
                  onClick={() => { clearMeal(editing.day, editing.slot); setEditing(null) }}
                  className="flex-1 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium"
                >
                  Ta bort
                </button>
              )}
              <button onClick={saveEdit} className="flex-1 py-3 rounded-xl bg-forest-700 text-white font-semibold">
                Spara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
