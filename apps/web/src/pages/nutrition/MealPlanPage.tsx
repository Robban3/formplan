import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, LeafIcon } from '../../components/ui/Icons'
import { useSettings } from '../../hooks/useSettings'
import {
  generateMealPlan,
  type DietFocus,
  type MealCount,
  type GeneratedMealPlan,
} from '../../lib/mealPlanGenerator'

const FOCUS_OPTIONS: { key: DietFocus; label: string; desc: string }[] = [
  { key: 'balanced',     label: 'Balanserat',   desc: '30% protein · 30% fett · 40% kolh.' },
  { key: 'high_protein', label: 'Hög protein',  desc: '40% protein · 25% fett · 35% kolh.' },
  { key: 'vegetarian',   label: 'Vegetarisk',   desc: 'Helt utan kött' },
  { key: 'low_carb',     label: 'Låg kolhydrat', desc: '35% protein · 45% fett · 20% kolh.' },
]

const MACRO_COLORS: Record<string, string> = {
  protein: '#22c55e',
  fat:     '#38bdf8',
  carbs:   '#fbbf24',
}

function MacroBar({ plan }: { plan: GeneratedMealPlan }) {
  const total = plan.totalProtein + plan.totalFat + plan.totalCarbs || 1
  const segs = [
    { key: 'protein', label: 'Protein',      g: plan.totalProtein, pct: plan.totalProtein / total },
    { key: 'fat',     label: 'Fett',         g: plan.totalFat,     pct: plan.totalFat / total },
    { key: 'carbs',   label: 'Kolhydrater',  g: plan.totalCarbs,   pct: plan.totalCarbs / total },
  ]
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {segs.map((s) => (
          <div
            key={s.key}
            style={{ width: `${s.pct * 100}%`, backgroundColor: MACRO_COLORS[s.key] }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {segs.map((s) => (
          <div key={s.key} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: MACRO_COLORS[s.key] }} />
            <span className="text-[10px] text-stone-500">{s.label} <span className="font-semibold text-stone-700">{s.g}g</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MealPlanPage() {
  const navigate = useNavigate()
  const settings = useSettings()

  const [kcal, setKcal] = useState(settings.calorie_goal)
  const [mealCount, setMealCount] = useState<MealCount>(4)
  const [focus, setFocus] = useState<DietFocus>('balanced')
  const [plan, setPlan] = useState<GeneratedMealPlan | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [variation, setVariation] = useState(0)

  function generate() {
    setPlan(generateMealPlan(kcal, mealCount, focus, variation))
    setExpanded(null)
  }

  function regenerate() {
    const next = variation + 1
    setVariation(next)
    setPlan(generateMealPlan(kcal, mealCount, focus, next))
    setExpanded(null)
  }

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
          Kost
        </button>
        <h1 className="text-2xl font-bold text-stone-900">Kostschema</h1>
        <p className="text-sm text-stone-400 mt-0.5">Generera ett dagsmeny anpassat efter dina mål</p>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {/* Kaloriintag */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-800">Dagligt kaloriintag</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              value={kcal}
              min={800}
              max={6000}
              step={50}
              onChange={(e) => setKcal(Math.max(800, Math.min(6000, Number(e.target.value))))}
              className="flex-1 bg-stone-100 rounded-xl px-4 py-3 text-stone-900 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-forest-400"
            />
            <span className="text-stone-400 font-medium">kcal</span>
          </div>
          <div className="flex gap-2">
            {[1500, 1800, 2000, 2500].map((k) => (
              <button
                key={k}
                onClick={() => setKcal(k)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  kcal === k ? 'bg-forest-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Antal måltider */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-800">Antal måltider per dag</p>
          <div className="flex gap-2">
            {([3, 4, 5] as MealCount[]).map((n) => (
              <button
                key={n}
                onClick={() => setMealCount(n)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  mealCount === n
                    ? 'bg-forest-600 text-white'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {n} måltider
              </button>
            ))}
          </div>
        </div>

        {/* Kostfokus */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-800">Kostfokus</p>
          <div className="grid grid-cols-2 gap-2">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFocus(opt.key)}
                className={`p-3 rounded-xl text-left border-2 transition-colors ${
                  focus === opt.key
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-stone-100 bg-stone-50'
                }`}
              >
                <p className={`text-sm font-semibold ${focus === opt.key ? 'text-forest-700' : 'text-stone-800'}`}>
                  {opt.label}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          className="w-full bg-forest-600 hover:bg-forest-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          <LeafIcon className="w-5 h-5 stroke-white" />
          Generera kostschema
        </button>

        {/* Result */}
        {plan && (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="bg-forest-600 rounded-2xl p-4 text-white">
              <div className="flex items-baseline justify-between mb-3">
                <p className="font-bold text-lg">{plan.totalKcal.toLocaleString('sv-SE')} kcal</p>
                <p className="text-forest-200 text-sm">{plan.meals.length} måltider</p>
              </div>
              <MacroBar plan={plan} />
            </div>

            {/* Meal cards */}
            {plan.meals.map((meal, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center flex-shrink-0">
                    <LeafIcon className="w-5 h-5 stroke-forest-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-stone-900">{meal.label}</p>
                      <span className="text-xs text-stone-400">{meal.time}</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {meal.total.kcal} kcal · P {Math.round(meal.total.protein_g)}g · F {Math.round(meal.total.fat_g)}g · K {Math.round(meal.total.carbs_g)}g
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 stroke-stone-300 flex-shrink-0 transition-transform ${expanded === i ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {expanded === i && (
                  <div className="border-t border-stone-50 divide-y divide-stone-50">
                    {meal.foods.map((food, j) => (
                      <div key={j} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-stone-800">{food.name}</p>
                          <p className="text-xs text-stone-400">
                            {food.amount_g} g · P {food.protein_g}g · F {food.fat_g}g · K {food.carbs_g}g
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-stone-700 ml-3 flex-shrink-0">
                          {food.kcal} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Regenerate */}
            <button
              onClick={regenerate}
              className="w-full py-3 border border-stone-200 rounded-2xl text-sm text-stone-500 font-medium hover:border-forest-400 hover:text-forest-600 transition-colors"
            >
              Generera nytt förslag
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
