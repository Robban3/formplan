import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon, ClockIcon } from '../components/ui/Icons'
import { RECIPES, RecipeIllustration } from './RecipesPage'
import { nutritionApi, type MealSlot } from '../lib/nutritionApi'
import { dateKey } from '../lib/derive'
import { toast } from '../lib/toast'

// Receptets måltidstagg → dagbokens slot-enum. Faller tillbaka på lunch när
// taggen inte pekar ut en tydlig måltid.
const TAG_TO_SLOT: Record<string, MealSlot> = {
  Frukost: 'frukost',
  Lunch: 'lunch',
  Middag: 'middag',
  Mellanmål: 'mellanmar',
}

function slotForRecipe(tags: string[]): MealSlot {
  for (const t of tags) {
    if (TAG_TO_SLOT[t]) return TAG_TO_SLOT[t]
  }
  return 'lunch'
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = RECIPES.find((r) => r.id === id)
  const [logging, setLogging] = useState(false)

  if (!recipe) {
    return (
      <div className="px-5 pt-12 text-center text-stone-400">
        <p>Receptet hittades inte.</p>
        <button onClick={() => navigate(-1)} className="text-forest-600 mt-2">Tillbaka</button>
      </div>
    )
  }

  // Logga receptet som en portion i kostdagboken. Kcal/makros lagras absolut
  // ("1 portion"); amount_g = 1 är en nominell platshållare (portionsvikten är
  // okänd) så per-gram-beräkningar inte blir fel.
  async function logToDiary() {
    if (!recipe || logging) return
    setLogging(true)
    try {
      await nutritionApi.addLogEntry({
        date: dateKey(),
        meal_slot: slotForRecipe(recipe.tags),
        food_id: null,
        food_name: recipe.name,
        serving_label: '1 portion',
        amount_g: 1,
        kcal: recipe.calories,
        protein_g: recipe.protein_g,
        fat_g: recipe.fat_g,
        carbs_g: recipe.carbs_g,
      })
      toast.success(`${recipe.name} tillagd i kostdagboken`)
      navigate(-1)
    } catch (e) {
      toast.error((e as Error).message || 'Kunde inte logga måltiden')
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="pb-10 bg-canvas min-h-screen">
      {/* Hero illustration */}
      <div className={`relative h-56 ${recipe.bg} flex items-center justify-center overflow-hidden`}>
        <div className="scale-[2.4]">
          <RecipeIllustration kind={recipe.illustration} bg={recipe.bg} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow"
        >
          <ChevronLeftIcon className="w-5 h-5 stroke-stone-700" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 -mt-6 relative">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100">
          <h1 className="text-xl font-bold text-stone-900 mb-1">{recipe.name}</h1>
          <div className="flex items-center gap-3 text-sm text-stone-400 mb-4">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4 stroke-stone-400" />
              {recipe.prepMinutes} min
            </span>
            <span>·</span>
            <span>{recipe.servings} {recipe.servings === 1 ? 'portion' : 'portioner'}</span>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[
              { label: 'Kalorier', value: recipe.calories, unit: 'kcal', color: 'bg-forest-50 text-forest-700' },
              { label: 'Protein',  value: recipe.protein_g, unit: 'g', color: 'bg-blue-50 text-blue-700' },
              { label: 'Fett',     value: recipe.fat_g,     unit: 'g', color: 'bg-amber-50 text-amber-700' },
              { label: 'Kolhyd.', value: recipe.carbs_g,   unit: 'g', color: 'bg-teal-50 text-teal-700' },
            ].map((m) => (
              <div key={m.label} className={`${m.color} rounded-xl p-2.5 text-center`}>
                <p className="font-bold text-sm">{m.value}</p>
                <p className="text-[10px] opacity-70">{m.unit}</p>
                <p className="text-[10px] font-medium mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="mt-4 bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-50">
            <h2 className="font-semibold text-stone-900">Ingredienser</h2>
          </div>
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-stone-50' : ''}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-forest-500 flex-shrink-0" />
              <span className="text-sm text-stone-700">{ing}</span>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="mt-4 bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-50">
            <h2 className="font-semibold text-stone-900">Gör så här</h2>
          </div>
          {recipe.instructions.map((step, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-stone-50' : ''}`}>
              <div className="w-6 h-6 rounded-full bg-forest-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-stone-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {/* Add to diary */}
        <button
          onClick={logToDiary}
          disabled={logging}
          className="mt-5 w-full bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition-colors"
        >
          {logging ? 'Lägger till…' : 'Lägg till i kostdagbok'}
        </button>
      </div>
    </div>
  )
}
