import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon, XIcon, LeafIcon, ZapIcon } from '../../components/ui/Icons'
import { generateMealPlan, type MealCount, type DietFocus } from '../../lib/mealPlanGenerator'
import {
  loadWeekPlan,
  saveWeekPlan,
  dayTotalKcal,
  weekdayOf,
  type WeekMealPlan,
  type WeekSlot,
} from '../../lib/weekMealStore'
import { api } from '../../lib/api'
import { toast } from '../../lib/toast'

const DAY_SHORT = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
const DAY_FULL = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
const SLOT_LABELS: Record<WeekSlot, string> = {
  frukost: 'Frukost', lunch: 'Lunch', middag: 'Middag', mellanmar: 'Mellanmål',
}
const SLOTS: WeekSlot[] = ['frukost', 'lunch', 'middag', 'mellanmar']
const FOCUS_OPTIONS: { key: DietFocus; label: string }[] = [
  { key: 'balanced', label: 'Balanserat' },
  { key: 'high_protein', label: 'Hög protein' },
  { key: 'vegetarian', label: 'Vegetariskt' },
  { key: 'low_carb', label: 'Låg kolhydrat' },
]
const KCAL_PRESETS = [1500, 1800, 2000, 2500]

export function MealWeekPage() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<WeekMealPlan>(loadWeekPlan)
  const [selected, setSelected] = useState(weekdayOf(new Date()))
  const [addSlot, setAddSlot] = useState<WeekSlot | null>(null)
  const [addText, setAddText] = useState('')
  const [addBusy, setAddBusy] = useState(false)

  const today = weekdayOf(new Date())

  function update(p: WeekMealPlan) {
    setPlan({ ...p })
    saveWeekPlan(p)
  }

  function generateWeek() {
    const days = { ...plan.days }
    for (let d = 1; d <= 7; d++) {
      days[d] = { ...days[d]!, generated: generateMealPlan(plan.kcal, plan.mealCount, plan.focus, d) }
    }
    update({ ...plan, days })
    toast.success('Veckan genererades!')
  }

  function regenerateDay(day: number) {
    const days = { ...plan.days }
    const seed = day * 1000 + Math.floor(Math.random() * 1000)
    days[day] = { ...days[day]!, generated: generateMealPlan(plan.kcal, plan.mealCount, plan.focus, seed) }
    update({ ...plan, days })
  }

  function removeCustom(day: number, id: string) {
    const days = { ...plan.days }
    days[day] = { ...days[day]!, custom: days[day]!.custom.filter((m) => m.id !== id) }
    update({ ...plan, days })
  }

  async function addCustom() {
    if (!addSlot || !addText.trim() || addBusy) return
    setAddBusy(true)
    try {
      const { estimate } = await api.estimateMeal(addText.trim())
      const days = { ...plan.days }
      days[selected] = {
        ...days[selected]!,
        custom: [
          ...days[selected]!.custom,
          {
            id: crypto.randomUUID(),
            slot: addSlot,
            name: estimate.name,
            kcal: estimate.kcal,
            protein_g: estimate.protein_g,
            fat_g: estimate.fat_g,
            carbs_g: estimate.carbs_g,
          },
        ],
      }
      update({ ...plan, days })
      setAddSlot(null)
      setAddText('')
      toast.success('Måltid tillagd!')
    } catch (e) {
      toast.error((e as Error).message || 'Kunde inte uppskatta måltiden')
    } finally {
      setAddBusy(false)
    }
  }

  const day = plan.days[selected]!
  const dayKcal = dayTotalKcal(day)
  const isEmpty = !day.generated && day.custom.length === 0

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="px-5 pt-header pb-4 bg-white border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
          Kost
        </button>
        <h1 className="text-2xl font-bold text-stone-900">Veckoplanering</h1>
        <p className="text-sm text-stone-400 mt-0.5">Generera hela veckan eller enstaka dagar utifrån kalorier</p>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Controls */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-800 text-sm">Dagligt kaloriintag</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={plan.kcal}
              onChange={(e) => update({ ...plan, kcal: Math.max(800, Math.min(6000, Number(e.target.value) || 0)) })}
              className="flex-1 bg-stone-100 rounded-xl px-4 py-2.5 text-stone-900 font-bold text-center focus:outline-none focus:ring-2 focus:ring-forest-400"
            />
            <span className="text-stone-400 text-sm">kcal</span>
          </div>
          <div className="flex gap-2">
            {KCAL_PRESETS.map((k) => (
              <button
                key={k}
                onClick={() => update({ ...plan, kcal: k })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  plan.kcal === k ? 'bg-forest-700 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {([3, 4, 5] as MealCount[]).map((n) => (
              <button
                key={n}
                onClick={() => update({ ...plan, mealCount: n })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  plan.mealCount === n ? 'bg-forest-700 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {n} måltider
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => update({ ...plan, focus: opt.key })}
                className={`py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                  plan.focus === opt.key
                    ? 'border-forest-600 bg-forest-50 text-forest-700'
                    : 'border-stone-100 bg-stone-50 text-stone-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={generateWeek}
            className="w-full bg-forest-700 hover:bg-forest-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <LeafIcon className="w-5 h-5 stroke-white" />
            Generera hela veckan
          </button>
        </div>

        {/* Week strip */}
        <div className="grid grid-cols-7 gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => {
            const total = dayTotalKcal(plan.days[d]!)
            const isSel = d === selected
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className={`rounded-xl py-2 flex flex-col items-center gap-0.5 border transition-colors ${
                  isSel ? 'bg-forest-700 border-forest-700 text-white' : 'bg-white border-stone-100 text-stone-600'
                } ${d === today && !isSel ? 'ring-1 ring-forest-300' : ''}`}
              >
                <span className="text-[11px] font-semibold">{DAY_SHORT[d - 1]}</span>
                <span className={`text-[10px] ${isSel ? 'text-forest-100' : 'text-stone-400'}`}>
                  {total > 0 ? total : '–'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Selected day */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-stone-900">{DAY_FULL[selected - 1]}</p>
              <p className="text-xs text-stone-400">{dayKcal} kcal totalt</p>
            </div>
            <button
              onClick={() => regenerateDay(selected)}
              className="text-xs px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 font-medium hover:border-forest-400 hover:text-forest-700 transition-colors"
            >
              Regenerera dag
            </button>
          </div>

          {isEmpty && (
            <p className="text-center text-stone-400 text-sm py-6">
              Inga måltider än. Generera veckan, regenerera dagen eller lägg till en egen måltid.
            </p>
          )}

          {/* Generated meals */}
          {day.generated?.meals.map((meal, i) => (
            <div key={`gen-${i}`} className="border-b border-stone-50 py-3 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-stone-800">{meal.label}</p>
                <span className="text-xs font-medium text-stone-500">{meal.total.kcal} kcal</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                {meal.foods.map((f) => `${f.name} (${f.amount_g} g)`).join(' · ')}
              </p>
            </div>
          ))}

          {/* Custom meals */}
          {day.custom.map((m) => (
            <div key={m.id} className="flex items-center justify-between border-b border-stone-50 py-3 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{m.name}</p>
                <p className="text-xs text-stone-400">{SLOT_LABELS[m.slot]} · {m.kcal} kcal</p>
              </div>
              <button onClick={() => removeCustom(selected, m.id)} className="p-1 flex-shrink-0">
                <XIcon className="w-4 h-4 stroke-stone-300" />
              </button>
            </div>
          ))}

          <button
            onClick={() => setAddSlot('frukost')}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 border border-dashed border-stone-200 rounded-xl text-sm text-forest-600 font-medium hover:bg-forest-50 transition-colors"
          >
            <PlusIcon className="w-4 h-4 stroke-forest-600" />
            Lägg till egen måltid
          </button>
        </div>
      </div>

      {/* Add custom meal modal */}
      {addSlot && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900">Egen måltid · {DAY_FULL[selected - 1]}</h3>
              <button onClick={() => { setAddSlot(null); setAddText('') }}>
                <XIcon className="w-5 h-5 stroke-stone-400" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setAddSlot(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    addSlot === s ? 'bg-forest-700 text-white border-forest-700' : 'bg-white border-stone-200 text-stone-600'
                  }`}
                >
                  {SLOT_LABELS[s]}
                </button>
              ))}
            </div>

            <input
              autoFocus
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              placeholder="t.ex. kvarg med bär"
              className="w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400"
            />
            <p className="text-[11px] text-stone-400 -mt-1">AI uppskattar kalorierna för en normal portion.</p>

            <button
              onClick={addCustom}
              disabled={!addText.trim() || addBusy}
              className="w-full py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <ZapIcon className="w-4 h-4 stroke-white" />
              {addBusy ? 'Uppskattar…' : 'Lägg till'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
