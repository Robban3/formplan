import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, ShoppingCartIcon, CheckIcon } from '../../components/ui/Icons'
import { useSettings } from '../../hooks/useSettings'
import type { DietFocus, MealCount } from '../../lib/mealPlanGenerator'
import {
  buildWeeklyShoppingList,
  loadChecked,
  saveChecked,
  formatAmount,
} from '../../lib/shoppingList'

const FOCUS_OPTIONS: { key: DietFocus; label: string }[] = [
  { key: 'balanced', label: 'Balanserat' },
  { key: 'high_protein', label: 'Hög protein' },
  { key: 'vegetarian', label: 'Vegetariskt' },
  { key: 'low_carb', label: 'Låg kolhydrat' },
]

export function ShoppingListPage() {
  const navigate = useNavigate()
  const settings = useSettings()

  const [focus, setFocus] = useState<DietFocus>('balanced')
  const [mealCount, setMealCount] = useState<MealCount>(4)
  const [seed, setSeed] = useState(0)
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked())

  // Recompute whenever inputs change; seed forces a fresh list on "regenerate".
  const categories = useMemo(
    () => buildWeeklyShoppingList(settings.calorie_goal, focus, mealCount, 7, seed),
    [settings.calorie_goal, focus, mealCount, seed]
  )

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
    saveChecked(next)
  }

  function clearChecked() {
    const next = new Set<string>()
    setChecked(next)
    saveChecked(next)
  }

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-5 pt-header pb-4 bg-white border-b border-stone-100">
        <button onClick={() => navigate('/kost')} className="flex items-center gap-1 text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
          Kost
        </button>
        <div className="flex items-center gap-2">
          <ShoppingCartIcon className="w-6 h-6 stroke-forest-600" />
          <h1 className="text-2xl font-bold text-stone-900">Inköpslista</h1>
        </div>
        <p className="text-sm text-stone-400 mt-0.5">Veckans varor utifrån ditt kostschema</p>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {/* Kostfokus */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-800 text-sm">Kostfokus</p>
          <div className="grid grid-cols-2 gap-2">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFocus(opt.key)}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  focus === opt.key
                    ? 'border-forest-600 bg-forest-50 text-forest-700'
                    : 'border-stone-100 bg-stone-50 text-stone-600'
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
                  mealCount === n ? 'bg-forest-700 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {n} måltider
              </button>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            {checkedCount}/{totalItems} varor i kundvagnen
          </p>
          {checkedCount > 0 && (
            <button onClick={clearChecked} className="text-xs text-stone-400 underline">
              Återställ
            </button>
          )}
        </div>

        {/* Categories */}
        {categories.map((cat) => (
          <div key={cat.category} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{cat.category}</p>
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
                      isChecked ? 'bg-forest-700 border-forest-600' : 'border-stone-300'
                    }`}
                  >
                    {isChecked && <CheckIcon className="w-3.5 h-3.5 stroke-white" />}
                  </span>
                  <span className={`flex-1 text-sm ${isChecked ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-stone-400 flex-shrink-0">{formatAmount(item.amount_g)}</span>
                </button>
              )
            })}
          </div>
        ))}

        {/* Regenerate */}
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="w-full py-3 border border-stone-200 rounded-2xl text-sm text-stone-500 font-medium hover:border-forest-400 hover:text-forest-600 transition-colors"
        >
          Generera ny lista
        </button>
      </div>
    </div>
  )
}
