import { useCallback, useEffect, useState } from 'react'
import {
  nutritionApi,
  type DailyGoals,
  type FoodItem,
  type FoodLogEntry,
  type MealSlot,
  type WaterEntry,
} from '../../lib/nutritionApi'
import { dateKey } from '../../lib/derive'
import { toast } from '../../lib/toast'
import { MacroRing } from '../../components/nutrition/MacroRing'
import { MacroBar } from '../../components/nutrition/MacroBar'
import { MealSection } from '../../components/nutrition/MealSection'
import { PlusIcon, XIcon } from '../../components/ui/Icons'

const SLOTS: MealSlot[] = ['frukost', 'lunch', 'middag', 'mellanmar']
const WATER_PRESETS = [200, 330, 500]
const WATER_GOAL_ML = 2500

export function NutritionHome() {
  const today = dateKey()
  const [entries, setEntries] = useState<FoodLogEntry[]>([])
  const [goals, setGoals] = useState<DailyGoals>({ kcal: 2000, protein_g: 150, fat_g: 56, carbs_g: 225 })
  const [water, setWater] = useState<WaterEntry[]>([])
  const [waterTotal, setWaterTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchSlot, setSearchSlot] = useState<MealSlot | null>(null)

  const load = useCallback(async () => {
    try {
      const [log, w] = await Promise.all([
        nutritionApi.getDailyLog(today),
        nutritionApi.getWater(today),
      ])
      setEntries(log.entries)
      setGoals(log.goals)
      setWater(w.entries)
      setWaterTotal(w.total_ml)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    load()
  }, [load])

  const eaten = entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein_g: acc.protein_g + e.protein_g,
      fat_g: acc.fat_g + e.fat_g,
      carbs_g: acc.carbs_g + e.carbs_g,
    }),
    { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 }
  )

  async function handleDelete(entry: FoodLogEntry) {
    if (!confirm(`Ta bort ${entry.food_name}?`)) return
    setEntries((es) => es.filter((e) => e.id !== entry.id))
    try {
      await nutritionApi.deleteLogEntry(entry.id)
    } catch (e) {
      toast.error((e as Error).message)
      load()
    }
  }

  async function handleAddWater(amount: number) {
    try {
      const { entry } = await nutritionApi.addWater(today, amount)
      setWater((w) => [...w, entry])
      setWaterTotal((t) => t + amount)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  async function handleUndoWater() {
    const last = water[water.length - 1]
    if (!last) return
    setWater((w) => w.slice(0, -1))
    setWaterTotal((t) => Math.max(0, t - last.amount_ml))
    try {
      await nutritionApi.deleteWater(last.id)
    } catch (e) {
      toast.error((e as Error).message)
      load()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-5 pt-12 pb-4 space-y-4">
      <h1 className="text-2xl font-bold text-stone-900">Kost</h1>

      {/* Calorie + macros summary */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <div className="flex items-center gap-5">
          <MacroRing eaten={Math.round(eaten.kcal)} goal={goals.kcal} />
          <div className="flex-1 space-y-3">
            <MacroBar label="Protein" eaten={Math.round(eaten.protein_g)} goal={goals.protein_g} color="bg-forest-500" />
            <MacroBar label="Kolhydrater" eaten={Math.round(eaten.carbs_g)} goal={goals.carbs_g} color="bg-amber-500" />
            <MacroBar label="Fett" eaten={Math.round(eaten.fat_g)} goal={goals.fat_g} color="bg-sky-500" />
          </div>
        </div>
      </div>

      {/* Water tracker */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-stone-800">💧 Vatten</span>
          <span className="text-sm text-stone-400">
            {(waterTotal / 1000).toLocaleString('sv-SE', { maximumFractionDigits: 1 })} / {WATER_GOAL_ML / 1000} L
          </span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-2 mb-3">
          <div
            className="bg-sky-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min((waterTotal / WATER_GOAL_ML) * 100, 100)}%` }}
          />
        </div>
        <div className="flex gap-2">
          {WATER_PRESETS.map((ml) => (
            <button
              key={ml}
              onClick={() => handleAddWater(ml)}
              className="flex-1 text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl py-2 transition-colors"
            >
              +{ml} ml
            </button>
          ))}
          <button
            onClick={handleUndoWater}
            disabled={water.length === 0}
            className="px-3 text-sm text-stone-400 disabled:opacity-40"
          >
            Ångra
          </button>
        </div>
      </div>

      {/* Meals */}
      {SLOTS.map((slot) => (
        <MealSection
          key={slot}
          slot={slot}
          entries={entries.filter((e) => e.meal_slot === slot)}
          onAdd={(s) => setSearchSlot(s)}
          onTapEntry={handleDelete}
        />
      ))}

      {searchSlot && (
        <FoodSearchModal
          slot={searchSlot}
          date={today}
          onClose={() => setSearchSlot(null)}
          onAdded={(entry) => {
            setEntries((es) => [...es, entry])
            setSearchSlot(null)
          }}
        />
      )}
    </div>
  )
}

const SLOT_LABELS: Record<MealSlot, string> = {
  frukost: 'frukost',
  lunch: 'lunch',
  middag: 'middag',
  mellanmar: 'mellanmål',
}

function FoodSearchModal({
  slot,
  date,
  onClose,
  onAdded,
}: {
  slot: MealSlot
  date: string
  onClose: () => void
  onAdded: (entry: FoodLogEntry) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const { items } = await nutritionApi.searchFoods(q)
        setResults(items)
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  function pick(food: FoodItem) {
    setSelected(food)
    setAmount(String(food.serving_size_g ?? 100))
  }

  async function add() {
    if (!selected) return
    const grams = Number(amount)
    if (!grams || grams <= 0) {
      toast.error('Ange en giltig mängd')
      return
    }
    const f = grams / 100
    setSaving(true)
    try {
      const { entry } = await nutritionApi.addLogEntry({
        date,
        meal_slot: slot,
        food_id: selected.id,
        food_name: selected.name,
        amount_g: grams,
        kcal: Math.round(selected.kcal_per_100g * f),
        protein_g: Math.round(selected.protein_per_100g * f),
        fat_g: Math.round(selected.fat_per_100g * f),
        carbs_g: Math.round(selected.carbs_per_100g * f),
      })
      toast.success(`${selected.name} tillagd`)
      onAdded(entry)
    } catch (e) {
      toast.error((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-bold text-lg text-stone-900">Lägg till i {SLOT_LABELS[slot]}</h2>
          <button onClick={onClose} className="p-1">
            <XIcon className="w-5 h-5 stroke-stone-400" />
          </button>
        </div>

        {!selected ? (
          <>
            <div className="px-5 pb-3">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök mat…"
                className="w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-hide">
              {searching && <p className="text-stone-400 text-sm py-2">Söker…</p>}
              {!searching && query.trim().length >= 2 && results.length === 0 && (
                <p className="text-stone-400 text-sm py-2">Inga träffar.</p>
              )}
              <div className="space-y-1">
                {results.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => pick(food)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-stone-800">{food.name}</span>
                    <span className="text-xs text-stone-400">{food.kcal_per_100g} kcal / 100g</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="px-5 pb-8 space-y-4">
            <div>
              <p className="font-semibold text-stone-900">{selected.name}</p>
              <p className="text-xs text-stone-400">{selected.kcal_per_100g} kcal per 100 g</p>
            </div>
            <label className="block">
              <span className="text-sm text-stone-500">Mängd (g)</span>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400"
              />
            </label>
            <p className="text-sm text-stone-500">
              ≈ {Math.round(selected.kcal_per_100g * (Number(amount) / 100 || 0))} kcal
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-medium"
              >
                Tillbaka
              </button>
              <button
                onClick={add}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-forest-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <PlusIcon className="w-4 h-4 stroke-white" />
                {saving ? 'Lägger till…' : 'Lägg till'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
