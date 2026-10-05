import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeftIcon, ShoppingCartIcon, CheckIcon } from '../../components/ui/Icons'
import { useSettings } from '../../hooks/useSettings'
import type { DietFocus, MealCount } from '../../lib/mealPlanGenerator'
import {
  buildShoppingListFromWeekPlan,
  buildWeeklyShoppingList,
  loadChecked,
  saveChecked,
  shoppingListHash,
  formatAmount,
} from '../../lib/shoppingList'
import { loadWeekPlan } from '../../lib/weekMealStore'
import { useT } from '../../hooks/useT'
import { useRestrictions } from '../../hooks/useRestrictions'

const FOCUS_OPTIONS: { key: DietFocus; label: string }[] = [
  { key: 'balanced', label: 'Balanserat' },
  { key: 'high_protein', label: 'Hög protein' },
  { key: 'vegetarian', label: 'Vegetariskt' },
  { key: 'low_carb', label: 'Låg kolhydrat' },
]

const VALID_FOCUS: DietFocus[] = ['balanced', 'high_protein', 'vegetarian', 'low_carb']

export function ShoppingListPage() {
  const { locale, t } = useT()
  const navigate = useNavigate()
  const settings = useSettings()
  const { restrictions, status: restrictionsStatus, ready: restrictionsReady, retry: retryRestrictions } = useRestrictions()
  const [params] = useSearchParams()

  // Initial focus/mealCount come from the MealPlanPage selection (query params)
  // when present, so the list matches the day the user just generated.
  const focusParam = params.get('focus') as DietFocus | null
  const mealsParam = Number(params.get('meals'))
  const kcalParam = Number(params.get('kcal'))

  const [focus, setFocus] = useState<DietFocus>(
    focusParam && VALID_FOCUS.includes(focusParam) ? focusParam : 'balanced'
  )
  const [mealCount, setMealCount] = useState<MealCount>(
    [3, 4, 5].includes(mealsParam) ? (mealsParam as MealCount) : 4
  )
  const [seed, setSeed] = useState(0)

  // Use the passed calorie target when valid, otherwise the app's goal.
  const kcal = kcalParam > 0 ? kcalParam : settings.calorie_goal

  // A saved week plan is the source of truth — the list must contain the foods
  // the user actually planned. Generated defaults are only a fallback.
  const planCategories = useMemo(() => buildShoppingListFromWeekPlan(loadWeekPlan()), [])
  const fromPlan = planCategories !== null

  // Recompute whenever inputs change; seed forces a fresh list on "regenerate".
  // Fallback-listan genereras först när hänsynen är KÄNDA. Tom lista betyder
  // "filtrera inte", så ett tidigt bygge gav en ofiltrerad inköpslista. Den
  // som kommer ur ett sparat veckoschema är redan filtrerad och behöver ingen
  // grind.
  const categories = useMemo(
    () =>
      planCategories ??
      (restrictionsReady ? buildWeeklyShoppingList(kcal, focus, mealCount, restrictions, 7, seed) : []),
    [planCategories, kcal, focus, mealCount, restrictions, restrictionsReady, seed]
  )

  /** Fallback-listan väntar på hänsynen — en tom lista får inte visas som "klar". */
  const pending = !fromPlan && !restrictionsReady

  // Checked state is keyed by the list's content — a new list resets it.
  const listHash = useMemo(() => shoppingListHash(categories), [categories])
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked(listHash))
  useEffect(() => {
    setChecked(loadChecked(listHash))
  }, [listHash])

  const totalItems = categories.reduce((n, c) => n + c.items.length, 0)
  const checkedCount = categories.reduce(
    (n, c) => n + c.items.filter((i) => checked.has(i.name)).length,
    0
  )

  function toggle(name: string) {
    const next = new Set(checked)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setChecked(next)
    saveChecked(next, listHash)
  }

  function clearChecked() {
    const next = new Set<string>()
    setChecked(next)
    saveChecked(next, listHash)
  }

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-5 pt-header pb-4 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <button onClick={() => navigate('/kost')} className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-500 dark:stroke-stone-400" />
          {t('nav.nutrition')}
        </button>
        <div className="flex items-center gap-2">
          <ShoppingCartIcon className="w-6 h-6 stroke-forest-600" />
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t('diary.shoppingList')}</h1>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          {fromPlan ? 'Veckans varor utifrån din sparade veckoplan' : 'Veckans varor utifrån ditt kostschema'}
        </p>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {/* Kostfokus — bara relevant när listan genereras (ingen sparad veckoplan) */}
        {!fromPlan && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
          <p className="font-semibold text-stone-800 dark:text-stone-200 text-sm">{t('diet.focus')}</p>
          <div className="grid grid-cols-2 gap-2">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFocus(opt.key)}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  focus === opt.key
                    ? 'border-forest-600 bg-forest-50 dark:bg-forest-900/30 text-forest-800 dark:text-forest-300'
                    : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {([3, 4, 5] as MealCount[]).map((n) => (
              <button
                key={n}
                onClick={() => setMealCount(n)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  mealCount === n ? 'bg-forest-700 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}
              >
                {n} måltider
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Progress */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {checkedCount}/{totalItems} varor i kundvagnen
          </p>
          {checkedCount > 0 && (
            <button onClick={clearChecked} className="text-xs text-stone-500 dark:text-stone-400 underline">
              {t('common.reset')}
            </button>
          )}
        </div>

        {/* Hänsynen okända — visa inte en tom lista som om den vore färdig. */}
        {pending && (
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 p-4 text-center">
            {restrictionsStatus === 'failed' ? (
              <>
                <p className="text-xs text-stone-600 dark:text-stone-300">{t('diet.restrictionsFailed')}</p>
                <button
                  onClick={retryRestrictions}
                  className="mt-2 text-xs font-semibold text-forest-700 dark:text-forest-400 underline"
                >
                  {t('common.tryAgain')}
                </button>
              </>
            ) : (
              <div className="flex justify-center">
                <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        {categories.map((cat) => (
          <div key={cat.category} className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">{cat.category}</p>
            </div>
            {cat.items.map((item, i) => {
              const isChecked = checked.has(item.name)
              return (
                <button
                  key={item.name}
                  onClick={() => toggle(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                    i > 0 ? 'border-t border-stone-50' : ''
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors ${
                      isChecked ? 'bg-forest-700 border-forest-600' : 'border-stone-300 dark:border-stone-600'
                    }`}
                  >
                    {isChecked && <CheckIcon className="w-3.5 h-3.5 stroke-white" />}
                  </span>
                  <span className={`flex-1 text-sm ${isChecked ? 'text-stone-500 dark:text-stone-400 line-through' : 'text-stone-800 dark:text-stone-200'}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 flex-shrink-0">{formatAmount(item.amount_g, locale)}</span>
                </button>
              )
            })}
          </div>
        ))}

        {/* Regenerate — only for the generated fallback list */}
        {!fromPlan && (
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="w-full py-3 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm text-stone-500 dark:text-stone-400 font-medium hover:border-forest-400 hover:text-forest-600 transition-colors"
          >
            {t('mealplan.generateNewList')}
          </button>
        )}
      </div>
    </div>
  )
}
