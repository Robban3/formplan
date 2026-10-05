import { useState, useEffect } from 'react'
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
import { mealSlotLabels } from '../../lib/texts'
import { useT } from '../../hooks/useT'
import { weekdayNames } from '../../lib/i18n'
import type { TextKey } from '../../lib/i18n'


const SLOTS: WeekSlot[] = ['frukost', 'lunch', 'middag', 'mellanmar']
/** Etiketterna kommer ur ordlistan; nycklarna är lagrade värden. */
const FOCUS_KEYS: DietFocus[] = ['balanced', 'high_protein', 'vegetarian', 'low_carb']
const KCAL_PRESETS = [1500, 1800, 2000, 2500]

// Faktiskt datum för en veckodag (1–7) i innevarande vecka.
function dateForWeekday(weekday: number): Date {
  const now = new Date()
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + (weekday - weekdayOf(now)))
  return d
}

/**
 * Profilens allergier och kosthänsyn.
 *
 * Läses här och inte i generatorn: generatorn är ren och ska gå att testa
 * utan nätverk. Misslyckas hämtningen blir listan tom — och tom lista
 * filtrerar inte, vilket är det enda säkra defaultvärdet som inte tömmer
 * matsedeln vid ett nätverksfel.
 */
function useRestrictions(): string[] {
  const [restrictions, setRestrictions] = useState<string[]>([])
  useEffect(() => {
    api
      .getProfile()
      .then(({ profile }) => {
        const p = profile as { allergies?: string[] } | null
        if (p?.allergies?.length) setRestrictions(p.allergies)
      })
      .catch(() => {})
  }, [])
  return restrictions
}

export function MealWeekPage() {
  const restrictions = useRestrictions()
  const { t, locale } = useT()
  const SLOT_LABELS = mealSlotLabels(t)
  const DAY_SHORT = weekdayNames(locale, 'short')
  const DAY_FULL = weekdayNames(locale, 'long')
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

  // Skyddsnät om generering triggas innan blur-klampningen hunnit köra.
  function clampedKcal() {
    const v = plan.kcal
    return Math.max(800, Math.min(6000, Number.isFinite(v) && v > 0 ? v : 800))
  }

  function generateWeek() {
    const days = { ...plan.days }
    for (let d = 1; d <= 7; d++) {
      days[d] = { ...days[d]!, generated: generateMealPlan(clampedKcal(), plan.mealCount, plan.focus, d, restrictions) }
    }
    update({ ...plan, days })
    toast.success('Veckan genererades!')
  }

  function regenerateDay(day: number) {
    const days = { ...plan.days }
    const seed = day * 1000 + Math.floor(Math.random() * 1000)
    days[day] = { ...days[day]!, generated: generateMealPlan(clampedKcal(), plan.mealCount, plan.focus, seed, restrictions) }
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
      toast.success(t('mealweek.mealAdded'))
    } catch (e) {
      toast.error((e as Error).message || t('mealweek.estimateFailed'))
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
      <div className="px-5 pt-header pb-4 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-500 dark:stroke-stone-400" />
          {t('nav.nutrition')}
        </button>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t('page.weekPlanning')}</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{t('mealweek.subtitle')}</p>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Controls */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
          <p className="font-semibold text-stone-800 dark:text-stone-200 text-sm">{t('mealplan.dailyCalories')}</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={plan.kcal}
              onChange={(e) => update({ ...plan, kcal: Number(e.target.value) || 0 })}
              onBlur={(e) => {
                // Klampa först när fältet lämnas — klamp per tangenttryck gör
                // det omöjligt att skriva t.ex. "2500" (första "2" → 800).
                const v = Number(e.target.value)
                update({ ...plan, kcal: Math.max(800, Math.min(6000, Number.isFinite(v) && v > 0 ? v : 800)) })
              }}
              className="flex-1 bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-2.5 text-stone-900 dark:text-stone-100 font-bold text-center focus:outline-none focus:ring-2 focus:ring-forest-400"
            />
            <span className="text-stone-500 dark:text-stone-400 text-sm">kcal</span>
          </div>
          <div className="flex gap-2">
            {KCAL_PRESETS.map((k) => (
              <button
                key={k}
                onClick={() => update({ ...plan, kcal: k })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  plan.kcal === k ? 'bg-forest-700 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
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
                  plan.mealCount === n ? 'bg-forest-700 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}
              >
                {t('mealweek.mealCount', { n })}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {FOCUS_KEYS.map((focusKey) => (
              <button
                key={focusKey}
                onClick={() => update({ ...plan, focus: focusKey })}
                className={`py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                  plan.focus === focusKey
                    ? 'border-forest-600 bg-forest-50 dark:bg-forest-900/30 text-forest-800 dark:text-forest-300'
                    : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                {t(`diet.${focusKey}` as TextKey)}
              </button>
            ))}
          </div>

          <button
            onClick={generateWeek}
            className="w-full bg-forest-700 hover:bg-forest-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <LeafIcon className="w-5 h-5 stroke-white" />
            {t('mealweek.generateWeek')}
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
                className={`rounded-xl py-1.5 flex flex-col items-center border transition-colors ${
                  isSel ? 'bg-forest-700 border-forest-700 text-white' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                } ${d === today && !isSel ? 'ring-1 ring-forest-300' : ''}`}
              >
                <span className="text-[10px] font-medium">{DAY_SHORT[d - 1]}</span>
                <span className="text-sm font-bold leading-tight">{dateForWeekday(d).getDate()}</span>
                <span className={`text-[9px] ${isSel ? 'text-forest-100' : 'text-stone-500 dark:text-stone-400'}`}>
                  {total > 0 ? total : '–'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Selected day */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">
                {DAY_FULL[selected - 1]} {dateForWeekday(selected).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t('mealweek.kcalTotal', { kcal: dayKcal })}</p>
            </div>
            <button
              onClick={() => regenerateDay(selected)}
              className="text-xs px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium hover:border-forest-400 hover:text-forest-700 dark:hover:text-forest-300 transition-colors"
            >
              {t('mealweek.regenerateDay')}
            </button>
          </div>

          {isEmpty && (
            <p className="text-center text-stone-500 dark:text-stone-400 text-sm py-6">
              {t('mealweek.empty')}
            </p>
          )}

          {/* Generated meals */}
          {day.generated?.meals.map((meal, i) => (
            <div key={`gen-${i}`} className="border-b border-stone-50 py-3 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{meal.label}</p>
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{meal.total.kcal} kcal</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {meal.foods.map((f) => `${f.name} (${f.amount_g} g)`).join(' · ')}
              </p>
            </div>
          ))}

          {/* Custom meals */}
          {day.custom.map((m) => (
            <div key={m.id} className="flex items-center justify-between border-b border-stone-50 py-3 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{m.name}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{SLOT_LABELS[m.slot]} · {m.kcal} kcal</p>
              </div>
              <button onClick={() => removeCustom(selected, m.id)} className="p-1 flex-shrink-0">
                <XIcon className="w-4 h-4 stroke-stone-300 dark:stroke-stone-600" />
              </button>
            </div>
          ))}

          <button
            onClick={() => setAddSlot('frukost')}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 border border-dashed border-stone-200 dark:border-stone-700 rounded-xl text-sm text-forest-800 dark:text-forest-400 font-medium hover:bg-forest-50 dark:hover:bg-forest-900/30 transition-colors"
          >
            <PlusIcon className="w-4 h-4 stroke-forest-600" />
            {t('mealweek.addOwnMeal')}
          </button>
        </div>
      </div>

      {/* Add custom meal modal */}
      {addSlot && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                {t('mealweek.ownMealOn', {
                  day: DAY_FULL[selected - 1] ?? '',
                  date: dateForWeekday(selected).getDate(),
                })}
              </h3>
              <button onClick={() => { setAddSlot(null); setAddText('') }}>
                <XIcon className="w-5 h-5 stroke-stone-500 dark:stroke-stone-400" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setAddSlot(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    addSlot === s ? 'bg-forest-700 text-white border-forest-700' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
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
              placeholder={t('mealweek.mealPlaceholder')}
              className="w-full bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-3 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-400"
            />
            <p className="text-[11px] text-stone-500 dark:text-stone-400 -mt-1">{t('mealweek.aiEstimates')}</p>

            <button
              onClick={addCustom}
              disabled={!addText.trim() || addBusy}
              className="w-full py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <ZapIcon className="w-4 h-4 stroke-white" />
              {addBusy ? 'Uppskattar…' : t('food.add')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
