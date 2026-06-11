import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nutritionApi, type DailyGoals, type FoodLogEntry } from '../../lib/nutritionApi'
import { dateKey } from '../../lib/derive'
import { MacroRing } from '../../components/nutrition/MacroRing'
import { MacroBar } from '../../components/nutrition/MacroBar'
import { ChevronLeftIcon } from '../../components/ui/Icons'

type Tab = 'oversikt' | 'detaljer'

const DEFAULT_GOALS: DailyGoals = { kcal: 2000, protein_g: 150, fat_g: 67, carbs_g: 250 }

const SLOT_LABELS: Record<string, string> = {
  frukost: 'Frukost',
  lunch: 'Lunch',
  middag: 'Middag',
  mellanmar: 'Mellanmål',
}

export function MacroPage() {
  const navigate = useNavigate()
  const today = dateKey()
  const [tab, setTab] = useState<Tab>('oversikt')
  const [entries, setEntries] = useState<FoodLogEntry[]>([])
  const [goals, setGoals] = useState<DailyGoals>(DEFAULT_GOALS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    nutritionApi
      .getDailyLog(today)
      .then(({ entries, goals }) => {
        setEntries(entries)
        setGoals(goals)
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [today])

  const eaten = entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein_g: acc.protein_g + e.protein_g,
      fat_g: acc.fat_g + e.fat_g,
      carbs_g: acc.carbs_g + e.carbs_g,
    }),
    { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 }
  )

  const kcalLeft = Math.max(0, goals.kcal - eaten.kcal)
  const pct = (v: number, g: number) => (g > 0 ? Math.round((v / g) * 100) : 0)

  return (
    <div className="pb-6">
      <div className="px-4 pt-header pb-3 flex items-center gap-3">
        <button onClick={() => navigate('/kost')} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
          <ChevronLeftIcon className="w-5 h-5 stroke-stone-600" />
        </button>
        <h1 className="text-xl font-bold text-stone-900">Makro</h1>
      </div>

      <div className="px-4 flex gap-5 border-b border-stone-100">
        {(['oversikt', 'detaljer'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'text-forest-600 border-b-2 border-forest-600' : 'text-stone-400'
            }`}
          >
            {t === 'oversikt' ? 'Översikt' : 'Detaljer'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center pt-12">
          <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'oversikt' ? (
        <div className="px-5 pt-6 space-y-5">
          <div className="bg-white rounded-2xl border border-stone-100 p-6 flex flex-col items-center">
            <MacroRing eaten={Math.round(eaten.kcal)} goal={goals.kcal} size={160} />
            <p className="text-sm text-stone-500 mt-3">Kalorier idag</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-4">
            <MacroBar
              label={`Protein (${pct(eaten.protein_g, goals.protein_g)}%)`}
              eaten={Math.round(eaten.protein_g)}
              goal={goals.protein_g}
              color="bg-sky-500"
            />
            <MacroBar
              label={`Fett (${pct(eaten.fat_g, goals.fat_g)}%)`}
              eaten={Math.round(eaten.fat_g)}
              goal={goals.fat_g}
              color="bg-amber-400"
            />
            <MacroBar
              label={`Kolhydrater (${pct(eaten.carbs_g, goals.carbs_g)}%)`}
              eaten={Math.round(eaten.carbs_g)}
              goal={goals.carbs_g}
              color="bg-forest-500"
            />
          </div>

          {kcalLeft > 0 && (
            <p className="text-sm text-stone-500 text-center">
              Du har {Math.round(kcalLeft)} kcal kvar att äta idag.
            </p>
          )}
        </div>
      ) : (
        <div className="px-5 pt-5 space-y-3">
          {entries.length === 0 ? (
            <p className="text-center text-stone-400 text-sm pt-12">Ingen mat loggad idag.</p>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden divide-y divide-stone-50">
              {entries.map((e) => (
                <div key={e.id} className="px-4 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{e.food_name}</p>
                      <p className="text-xs text-stone-400 capitalize">{SLOT_LABELS[e.meal_slot] ?? e.meal_slot}</p>
                    </div>
                    <span className="text-sm font-semibold text-stone-700">{e.kcal} kcal</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    P {Math.round(e.protein_g)}g · F {Math.round(e.fat_g)}g · K {Math.round(e.carbs_g)}g
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
