import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { nutritionApi, type FoodLogEntry, type DailyGoals, type MealSlot } from '../../lib/nutritionApi'
import { dateKey } from '../../lib/derive'
import { MacroSummary } from '../../components/nutrition/MacroSummary'
import { MealSection } from '../../components/nutrition/MealSection'
import { ChevronLeftIcon, ChevronRightIcon, DropletIcon, StarIcon, ShoppingCartIcon, SearchIcon } from '../../components/ui/Icons'
import { getTopFavorites, type FoodFavorite } from '../../lib/foodFavoritesStore'

const MEALS: MealSlot[] = ['frukost', 'lunch', 'middag', 'mellanmar']
const DEFAULT_GOALS: DailyGoals = { kcal: 2000, protein_g: 150, fat_g: 67, carbs_g: 250 }

const MEAL_LABELS: Record<MealSlot, string> = {
  frukost: 'Frukost', lunch: 'Lunch', middag: 'Middag', mellanmar: 'Mellanmål',
}

function mealMacros(entries: FoodLogEntry[]) {
  return {
    kcal: entries.reduce((s, e) => s + e.kcal, 0),
    protein_g: entries.reduce((s, e) => s + e.protein_g, 0),
  }
}

export function FoodDiary() {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date())
  const [entries, setEntries] = useState<FoodLogEntry[]>([])
  const [goals, setGoals] = useState<DailyGoals>(DEFAULT_GOALS)
  const [loading, setLoading] = useState(true)
  const [showMealMacros, setShowMealMacros] = useState(false)
  const favorites = getTopFavorites()

  const load = useCallback(async (d: Date) => {
    setLoading(true)
    try {
      const { entries, goals } = await nutritionApi.getDailyLog(dateKey(d))
      setEntries(entries)
      setGoals(goals)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(date) }, [date, load])

  const totalKcal = entries.reduce((s, e) => s + e.kcal, 0)
  const totalProtein = entries.reduce((s, e) => s + e.protein_g, 0)
  const totalFat = entries.reduce((s, e) => s + e.fat_g, 0)
  const totalCarbs = entries.reduce((s, e) => s + e.carbs_g, 0)

  const isToday = dateKey(date) === dateKey()

  function shiftDay(delta: number) {
    setDate((d) => {
      const next = new Date(d)
      next.setDate(next.getDate() + delta)
      return next
    })
  }

  function formatDate(d: Date) {
    if (isToday) return 'Idag, ' + d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
    return d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function entriesFor(slot: MealSlot) {
    return entries.filter((e) => e.meal_slot === slot)
  }

  function handleAdd(slot: MealSlot) {
    navigate(`/kost/sok?slot=${slot}&date=${dateKey(date)}`)
  }

  async function handleTapEntry(entry: FoodLogEntry) {
    if (!confirm(`Ta bort ${entry.food_name}?`)) return
    await nutritionApi.deleteLogEntry(entry.id)
    load(date)
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-5 pt-header pb-4 bg-white border-b border-stone-100">
        <h1 className="text-2xl font-bold text-stone-900 mb-3">Kostdagbok</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/kost/kostschema')}
            className="flex-1 min-w-0 h-9 rounded-xl bg-forest-50 text-forest-700 text-xs font-semibold hover:bg-forest-100 transition-colors truncate px-2"
          >
            Kostschema
          </button>
          <button
            onClick={() => navigate('/kost/veckoplan')}
            className="flex-1 min-w-0 h-9 rounded-xl bg-stone-100 text-stone-600 text-xs font-semibold hover:bg-stone-200 transition-colors truncate px-2"
          >
            Veckoplan
          </button>
          <button
            onClick={() => navigate('/kost/inkopslista')}
            className="w-9 h-9 flex-shrink-0 rounded-xl bg-forest-50 flex items-center justify-center hover:bg-forest-100 transition-colors"
            aria-label="Inköpslista"
          >
            <ShoppingCartIcon className="w-4 h-4 stroke-forest-600" />
          </button>
          <button
            onClick={() => navigate('/kost/vatten')}
            className="w-9 h-9 flex-shrink-0 rounded-xl bg-sky-50 flex items-center justify-center hover:bg-sky-100 transition-colors"
            aria-label="Vatten"
          >
            <DropletIcon className="w-4 h-4 stroke-sky-500" />
          </button>
        </div>

        {/* Sök livsmedel & näringsvärden */}
        <button
          onClick={() => navigate(`/kost/sok?slot=frukost&date=${dateKey(date)}`)}
          className="w-full mt-2 flex items-center gap-3 bg-stone-100 rounded-xl px-4 py-2.5 text-sm text-stone-500 hover:bg-stone-200 transition-colors"
        >
          <SearchIcon className="w-4 h-4 stroke-stone-400 flex-shrink-0" />
          Sök livsmedel & näringsvärden
        </button>

        {/* Date nav */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <button onClick={() => shiftDay(-1)} className="p-1.5 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors">
            <ChevronLeftIcon className="w-5 h-5 stroke-stone-500" />
          </button>
          <span className="text-sm font-medium text-stone-700 min-w-[140px] text-center capitalize">
            {formatDate(date)}
          </span>
          <button
            onClick={() => shiftDay(1)}
            disabled={isToday}
            className="p-1.5 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors disabled:opacity-30"
          >
            <ChevronRightIcon className="w-5 h-5 stroke-stone-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-12">
          <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-5 mt-5 space-y-4">
          <button
            onClick={() => navigate('/kost/makro')}
            className="w-full bg-white rounded-2xl border border-stone-100 p-4 text-left active:scale-[0.98] transition-transform"
          >
            <MacroSummary
              eaten={{ kcal: totalKcal, protein_g: totalProtein, fat_g: totalFat, carbs_g: totalCarbs }}
              goals={goals}
            />
            <p className="text-xs text-forest-600 font-medium text-center mt-2">Se makrotracker →</p>
          </button>

          {/* Makro per måltid */}
          {entries.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <button
                onClick={() => setShowMealMacros((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-semibold text-stone-800">Makro per måltid</span>
                <span className="text-xs text-forest-600">{showMealMacros ? 'Dölj ▲' : 'Visa ▼'}</span>
              </button>
              {showMealMacros && (
                <div className="border-t border-stone-50">
                  {MEALS.map((slot) => {
                    const m = mealMacros(entriesFor(slot))
                    if (m.kcal === 0) return null
                    return (
                      <div key={slot} className="flex items-center justify-between px-4 py-2.5 border-b border-stone-50 last:border-0">
                        <span className="text-sm text-stone-700">{MEAL_LABELS[slot]}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-stone-800">{m.kcal} kcal</span>
                          <span className="text-xs text-stone-400 ml-2">{m.protein_g.toFixed(0)}g protein</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Snabblogg favoriter */}
          {favorites.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <StarIcon className="w-4 h-4 stroke-amber-400" />
                <p className="text-sm font-semibold text-stone-800">Snabblogg</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {favorites.map((fav: FoodFavorite) => (
                  <button
                    key={fav.food_id}
                    onClick={() => navigate(`/kost/sok?slot=frukost&date=${dateKey(date)}&prefill=${fav.food_id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-full border border-stone-100 text-xs text-stone-700 hover:bg-forest-50 hover:border-forest-200 transition-colors"
                  >
                    <span>{fav.food_name}</span>
                    <span className="text-stone-400">{Math.round(fav.kcal_per_100g * fav.default_amount_g / 100)} kcal</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meal sections */}
          {MEALS.map((slot) => (
            <MealSection
              key={slot}
              slot={slot}
              entries={entriesFor(slot)}
              onAdd={handleAdd}
              onTapEntry={handleTapEntry}
            />
          ))}
        </div>
      )}
    </div>
  )
}
