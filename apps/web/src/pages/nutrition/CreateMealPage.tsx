import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { nutritionApi, type FoodItem } from '../../lib/nutritionApi'
import { isOffId } from '../../lib/openFoodFacts'
import {
  type MealIngredient,
  type CustomMeal,
  loadCustomMeals,
  saveCustomMeal,
  mealTotals,
} from '../../lib/customMeals'
import { toast } from '../../lib/toast'
import { XIcon, PlusIcon, UtensilsIcon } from '../../components/ui/Icons'

export function CreateMealPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('id')

  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState<MealIngredient[]>([])
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [pick, setPick] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState('100')

  useEffect(() => {
    if (!editId) return
    const meal = loadCustomMeals().find((m) => m.id === editId)
    if (meal) {
      setName(meal.name)
      setIngredients(meal.ingredients)
    }
  }, [editId])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const { items } = await nutritionApi.searchFoods(query)
        setResults(items)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const totals = mealTotals(ingredients)

  function addIngredient() {
    if (!pick) return
    const g = parseFloat(amount)
    if (!g || g <= 0) return
    const f = g / 100
    setIngredients((prev) => [
      ...prev,
      {
        food_id: isOffId(pick.id) ? null : pick.id,
        food_name: pick.name,
        amount_g: g,
        kcal: Math.round(pick.kcal_per_100g * f),
        protein_g: Math.round(pick.protein_per_100g * f * 10) / 10,
        fat_g: Math.round(pick.fat_per_100g * f * 10) / 10,
        carbs_g: Math.round(pick.carbs_per_100g * f * 10) / 10,
      },
    ])
    setPick(null)
    setQuery('')
    setResults([])
    setAmount('100')
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error('Ange ett måltidsnamn')
      return
    }
    if (ingredients.length === 0) {
      toast.error('Lägg till minst ett livsmedel')
      return
    }
    const meal: CustomMeal = {
      id: editId ?? crypto.randomUUID(),
      name: name.trim(),
      ingredients,
      createdAt: new Date().toISOString(),
    }
    saveCustomMeal(meal)
    toast.success('Måltid sparad!')
    navigate(-1)
  }

  return (
    <div className="flex flex-col min-h-full bg-white pb-28">
      <div className="flex items-center justify-between px-4 pt-header pb-4 border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
          <XIcon className="w-5 h-5 stroke-stone-500" />
        </button>
        <h1 className="font-bold text-stone-900">Skapa egen måltid</h1>
        <button onClick={handleSave} className="text-sm font-semibold text-forest-600">
          Spara
        </button>
      </div>

      <div className="px-5 py-5 space-y-5">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-stone-100 flex items-center justify-center">
            <UtensilsIcon className="w-12 h-12 stroke-stone-300" />
          </div>
        </div>

        <label className="block">
          <span className="text-sm text-stone-500">Måltidsnamn</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="t.ex. Kyckling bowl"
            className="mt-1 w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
        </label>

        <div>
          <p className="text-sm font-semibold text-stone-800 mb-2">Livsmedel</p>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-stone-50">
              <div>
                <p className="text-sm font-medium text-stone-800">{ing.food_name}</p>
                <p className="text-xs text-stone-400">{ing.amount_g} g · {ing.kcal} kcal</p>
              </div>
              <button
                onClick={() => setIngredients((prev) => prev.filter((_, j) => j !== i))}
                className="w-7 h-7 rounded-full bg-red-50 text-red-500 text-sm font-bold"
              >
                −
              </button>
            </div>
          ))}

          {!pick ? (
            <button
              onClick={() => setPick({ id: '', name: '', kcal_per_100g: 0, protein_per_100g: 0, fat_per_100g: 0, carbs_per_100g: 0 })}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 text-sm text-forest-600 font-medium border border-dashed border-stone-200 rounded-xl hover:bg-forest-50 transition-colors"
            >
              <PlusIcon className="w-4 h-4 stroke-forest-600" />
              Lägg till livsmedel
            </button>
          ) : (
            <div className="mt-3 space-y-3 bg-stone-50 rounded-xl p-4">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök livsmedel…"
                className="w-full bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
              />
              {searching && <p className="text-xs text-stone-400">Söker…</p>}
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPick(item)
                    setAmount(String(item.serving_size_g ?? 100))
                  }}
                  className="w-full text-left py-2 text-sm text-stone-700 hover:text-forest-600"
                >
                  {item.name} · {item.kcal_per_100g} kcal/100g
                </button>
              ))}
              {pick.id && (
                <>
                  <p className="text-sm font-medium text-stone-800">{pick.name}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                    />
                    <span className="text-sm text-stone-400">g</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPick(null); setQuery(''); setResults([]) }}
                      className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-600"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={addIngredient}
                      className="flex-1 py-2 rounded-xl bg-forest-700 text-white text-sm font-semibold"
                    >
                      Lägg till
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {ingredients.length > 0 && (
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-full max-w-lg px-5 py-4 bg-white border-t border-stone-100">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <p className="font-bold text-stone-900">{totals.kcal}</p>
              <p className="text-stone-400">kcal</p>
            </div>
            <div>
              <p className="font-bold text-stone-900">{Math.round(totals.protein_g)}g</p>
              <p className="text-stone-400">Protein</p>
            </div>
            <div>
              <p className="font-bold text-stone-900">{Math.round(totals.fat_g)}g</p>
              <p className="text-stone-400">Fett</p>
            </div>
            <div>
              <p className="font-bold text-stone-900">{Math.round(totals.carbs_g)}g</p>
              <p className="text-stone-400">Kolhydrater</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
