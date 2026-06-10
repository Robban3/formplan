import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { nutritionApi, type FoodItem, type MealSlot } from '../../lib/nutritionApi'
import { dateKey } from '../../lib/derive'
import { loadCustomMeals, mealTotals, type CustomMeal } from '../../lib/customMeals'
import { toast } from '../../lib/toast'
import { ChevronLeftIcon, XIcon, PlusIcon, UtensilsIcon, CameraIcon, ScanBarcodeIcon } from '../../components/ui/Icons'
import { recordFoodUsed } from '../../lib/foodFavoritesStore'

type SearchTab = 'alla' | 'mina' | 'maltider'

function FoodInitial({ name }: { name: string }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center font-bold text-sm text-stone-500 flex-shrink-0">
      {name.trim()[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export function FoodSearch() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const slot = (params.get('slot') ?? 'frukost') as MealSlot
  const date = params.get('date') ?? dateKey()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState('')
  const [adding, setAdding] = useState(false)
  const [tab, setTab] = useState<SearchTab>('alla')
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tab === 'maltider') setCustomMeals(loadCustomMeals())
  }, [tab])

  const SLOT_LABELS: Record<MealSlot, string> = {
    frukost: 'Frukost',
    lunch: 'Lunch',
    middag: 'Middag',
    mellanmar: 'Mellanmål',
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
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
    return () => clearTimeout(timer)
  }, [query])

  async function handleAddMeal(meal: CustomMeal) {
    setAdding(true)
    try {
      for (const ing of meal.ingredients) {
        await nutritionApi.addLogEntry({
          date,
          meal_slot: slot,
          food_id: ing.food_id ?? null,
          food_name: ing.food_name,
          amount_g: ing.amount_g,
          kcal: ing.kcal,
          protein_g: ing.protein_g,
          fat_g: ing.fat_g,
          carbs_g: ing.carbs_g,
        })
      }
      toast.success(`${meal.name} tillagd`)
      navigate(-1)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setAdding(false)
    }
  }

  async function handleAdd() {
    if (!selected || !amount) return
    const g = parseFloat(amount)
    if (isNaN(g) || g <= 0) return
    setAdding(true)
    try {
      const factor = g / 100
      await nutritionApi.addLogEntry({
        date,
        meal_slot: slot,
        food_id: selected.id,
        food_name: selected.name,
        amount_g: g,
        kcal: Math.round(selected.kcal_per_100g * factor),
        protein_g: Math.round(selected.protein_per_100g * factor * 10) / 10,
        fat_g: Math.round(selected.fat_per_100g * factor * 10) / 10,
        carbs_g: Math.round(selected.carbs_per_100g * factor * 10) / 10,
      })
      recordFoodUsed({
        food_id: selected.id,
        food_name: selected.name,
        default_amount_g: g,
        kcal_per_100g: selected.kcal_per_100g,
        protein_per_100g: selected.protein_per_100g,
        fat_per_100g: selected.fat_per_100g,
        carbs_per_100g: selected.carbs_per_100g,
      })
      navigate(-1)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white pb-4">
      <div className="flex items-center gap-3 px-4 pt-12 pb-3">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
          <ChevronLeftIcon className="w-5 h-5 stroke-stone-600" />
        </button>
        <h1 className="text-xl font-bold text-stone-900 flex-1">Livsmedelssökning</h1>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-3 bg-stone-100 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 stroke-stone-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök livsmedel..."
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setSelected(null) }}>
              <XIcon className="w-4 h-4 stroke-stone-400" />
            </button>
          )}
        </div>
        <p className="text-xs text-stone-400 mt-2">Lägger till i {SLOT_LABELS[slot].toLowerCase()}</p>

        {/* Quick add: scan barcode or photo */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigate(`/kost/skanna?slot=${slot}&date=${date}`)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-forest-50 text-forest-700 text-sm font-semibold hover:bg-forest-100 transition-colors"
          >
            <ScanBarcodeIcon className="w-4 h-4 stroke-forest-600" />
            Skanna streckkod
          </button>
          <button
            onClick={() => navigate(`/kost/foto?slot=${slot}&date=${date}`)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-forest-50 text-forest-700 text-sm font-semibold hover:bg-forest-100 transition-colors"
          >
            <CameraIcon className="w-4 h-4 stroke-forest-600" />
            Fotografera
          </button>
        </div>
      </div>

      <div className="px-4 flex gap-4 border-b border-stone-100">
        {([
          { key: 'alla' as const, label: 'Alla' },
          { key: 'mina' as const, label: 'Mina livsmedel' },
          { key: 'maltider' as const, label: 'Måltider' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 text-sm font-medium transition-colors ${
              tab === key ? 'text-forest-600 border-b-2 border-forest-600' : 'text-stone-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {searching && (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {tab === 'mina' && (
          <div className="text-center pt-12 px-4 text-stone-400 text-sm">
            Mina livsmedel kommer snart.
          </div>
        )}

        {tab === 'maltider' && (
          <div className="px-4 py-3 space-y-3">
            <button
              onClick={() => navigate('/kost/skapa-maltid')}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-200 rounded-xl text-sm text-forest-600 font-medium hover:bg-forest-50 transition-colors"
            >
              <PlusIcon className="w-4 h-4 stroke-forest-600" />
              Skapa egen måltid
            </button>
            {customMeals.length === 0 ? (
              <p className="text-center text-stone-400 text-sm pt-6">Inga sparade måltider ännu.</p>
            ) : (
              customMeals.map((meal) => {
                const t = mealTotals(meal.ingredients)
                return (
                  <button
                    key={meal.id}
                    onClick={() => handleAddMeal(meal)}
                    disabled={adding}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-stone-100 hover:bg-stone-50 active:bg-stone-100 transition-colors text-left disabled:opacity-60"
                  >
                    <div className="w-11 h-11 rounded-xl bg-forest-50 flex items-center justify-center flex-shrink-0">
                      <UtensilsIcon className="w-5 h-5 stroke-forest-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{meal.name}</p>
                      <p className="text-xs text-stone-400">
                        {meal.ingredients.length} livsmedel · {t.kcal} kcal
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center flex-shrink-0">
                      <PlusIcon className="w-4 h-4 stroke-white" />
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}

        {tab === 'alla' && !searching && results.length > 0 && (
          <div>
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelected(item)
                  setAmount(item.serving_size_g ? String(item.serving_size_g) : '100')
                }}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-stone-50 hover:bg-stone-50 active:bg-stone-100 transition-colors"
              >
                <FoodInitial name={item.name} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                  <p className="text-xs text-stone-400">
                    {item.serving_size_g ?? 100} g · {item.kcal_per_100g} kcal
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center flex-shrink-0">
                  <PlusIcon className="w-4 h-4 stroke-white" />
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'alla' && !searching && query.length >= 2 && results.length === 0 && (
          <div className="text-center pt-12 text-stone-400 text-sm">
            Inga livsmedel hittades för &quot;{query}&quot;
          </div>
        )}

        {tab === 'alla' && !query && (
          <div className="text-center pt-12 text-stone-400 text-sm">
            Börja skriva för att söka livsmedel
          </div>
        )}
      </div>

      {/* Amount + Add panel */}
      {selected && tab === 'alla' && (
        <div className="sticky bottom-0 border-t border-stone-100 px-4 py-4 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-800 truncate">{selected.name}</p>
              <p className="text-xs text-stone-400">
                {amount ? Math.round(selected.kcal_per_100g * parseFloat(amount) / 100) : 0} kcal
              </p>
            </div>
            <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 py-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-16 bg-transparent text-sm font-medium text-stone-800 text-right outline-none"
                min="1"
                max="2000"
              />
              <span className="text-sm text-stone-400">g</span>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !amount || parseFloat(amount) <= 0}
            className="w-full bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {adding ? 'Lägger till...' : 'Lägg till'}
          </button>
        </div>
      )}
    </div>
  )
}
