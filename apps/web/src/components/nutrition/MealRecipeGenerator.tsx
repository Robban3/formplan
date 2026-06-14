import { useState } from 'react'
import { api, ApiError, type GeneratedRecipe } from '../../lib/api'
import { nutritionApi, type MealSlot } from '../../lib/nutritionApi'
import { toast } from '../../lib/toast'
import { ZapIcon, ClockIcon } from '../ui/Icons'

// Slot → meal_type som AI:n förstår (slot-enumet använder 'mellanmar').
const MEAL_TYPE: Record<MealSlot, string> = {
  frukost: 'frukost',
  lunch: 'lunch',
  middag: 'middag',
  mellanmar: 'mellanmål',
}

// Rimligt kcal-förslag per måltid (redigerbart).
const KCAL_DEFAULT: Record<MealSlot, number> = {
  frukost: 400,
  lunch: 600,
  middag: 600,
  mellanmar: 250,
}

interface Props {
  slot: MealSlot
  date: string // YYYY-MM-DD
  onLogged?: () => void
}

export function MealRecipeGenerator({ slot, date, onLogged }: Props) {
  const [open, setOpen] = useState(false)
  const [ingredient, setIngredient] = useState('')
  const [kcal, setKcal] = useState(String(KCAL_DEFAULT[slot]))
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [logging, setLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (loading) return
    setLoading(true)
    setError(null)
    const ing = ingredient.trim()
    const prompt = ing ? `Ett recept med ${ing}` : 'Ett gott och varierat recept'
    try {
      const { recipe } = await api.generateRecipe({
        prompt,
        calorie_target: kcal ? Number(kcal) : null,
        meal_type: MEAL_TYPE[slot],
      })
      setRecipe(recipe)
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setError('Receptgenerering är en Premium-funktion. Uppgradera under Mer → Premium.')
      } else {
        setError((e as Error).message || 'Kunde inte generera recept just nu. Försök igen.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function logMeal() {
    if (!recipe || logging) return
    setLogging(true)
    try {
      // Logga en portion av receptet som en post. amount_g måste vara > 0; vi
      // uppskattar portionsvikten från makromassan (kcal/makros lagras absolut).
      const grams = Math.max(1, Math.round(recipe.protein_g + recipe.fat_g + recipe.carbs_g))
      await nutritionApi.addLogEntry({
        date,
        meal_slot: slot,
        food_id: null,
        food_name: recipe.name,
        serving_label: '1 portion',
        amount_g: grams,
        kcal: recipe.kcal,
        protein_g: recipe.protein_g,
        fat_g: recipe.fat_g,
        carbs_g: recipe.carbs_g,
      })
      toast.success('Måltid loggad!')
      setOpen(false)
      setRecipe(null)
      onLogged?.()
    } catch (e) {
      toast.error((e as Error).message || 'Kunde inte logga måltiden')
    } finally {
      setLogging(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-t border-stone-50 text-sm text-forest-600 font-medium hover:bg-forest-50 transition-colors"
      >
        <ZapIcon className="w-4 h-4 stroke-forest-600" />
        Generera recept med AI
      </button>
    )
  }

  return (
    <div className="border-t border-stone-50 p-4 space-y-3 bg-stone-50/60">
      <div className="flex items-center gap-2">
        <input
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
          placeholder="Råvara, t.ex. kyckling (valfritt)"
          className="flex-1 min-w-0 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
        />
        <div className="flex items-center gap-1 bg-white rounded-xl px-3 py-2">
          <input
            type="number"
            inputMode="numeric"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            className="w-14 text-sm text-center focus:outline-none"
          />
          <span className="text-xs text-stone-400">kcal</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setRecipe(null); setError(null) }}
          className="px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600"
        >
          Stäng
        </button>
        <button
          onClick={generate}
          disabled={loading}
          className="flex-1 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Skapar recept…' : recipe ? 'Generera nytt' : 'Generera recept'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}

      {recipe && (
        <div className="bg-white rounded-xl border border-stone-100 p-3">
          <h3 className="font-bold text-stone-900 text-sm">{recipe.name}</h3>
          <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5 mb-2">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3 stroke-stone-400" />
              {recipe.prep_minutes} min
            </span>
            <span>·</span>
            <span>{recipe.servings} {recipe.servings === 1 ? 'portion' : 'portioner'}</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mb-3 text-center">
            {[
              { v: recipe.kcal, l: 'kcal' },
              { v: `${recipe.protein_g}g`, l: 'Protein' },
              { v: `${recipe.fat_g}g`, l: 'Fett' },
              { v: `${recipe.carbs_g}g`, l: 'Kolhyd.' },
            ].map((m) => (
              <div key={m.l} className="bg-forest-50 rounded-lg py-1.5">
                <p className="font-bold text-forest-700 text-xs">{m.v}</p>
                <p className="text-[9px] text-forest-600/70">{m.l}</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1">Ingredienser</p>
          <ul className="space-y-1 mb-3">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-stone-700">
                <span className="w-1 h-1 rounded-full bg-forest-400 flex-shrink-0 mt-1.5" />
                {ing}
              </li>
            ))}
          </ul>

          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1">Tillagning</p>
          <ol className="space-y-1.5">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs text-stone-700">
                <span className="w-4 h-4 rounded-full bg-forest-700 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-semibold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <button
            onClick={logMeal}
            disabled={logging}
            className="w-full mt-3 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {logging ? 'Loggar…' : `Logga måltid (${recipe.kcal} kcal)`}
          </button>
        </div>
      )}
    </div>
  )
}
