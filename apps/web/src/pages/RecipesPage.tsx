import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FireIcon,
  ZapIcon,
  BeefIcon,
  FishIcon,
  WheatIcon,
  SaladIcon,
  SproutIcon,
} from '../components/ui/Icons'
import { api, type GeneratedRecipe, type RecipeCategory } from '../lib/api'
import { useT } from '../hooks/useT'
import { recipes, type Recipe, type IllustrationKey } from '../lib/content/recipes'
import type { TextKey } from '../lib/i18n'

type IconComponent = React.ComponentType<{ className?: string }>

const RECIPE_CATEGORIES: { key: RecipeCategory; labelKey: TextKey; Icon: IconComponent }[] = [
  { key: 'kott', labelKey: 'recipeCat.meat', Icon: BeefIcon },
  { key: 'fisk', labelKey: 'recipeCat.fish', Icon: FishIcon },
  { key: 'pasta', labelKey: 'recipeCat.pasta', Icon: WheatIcon },
  { key: 'vegetariskt', labelKey: 'recipeCat.vegetarian', Icon: SaladIcon },
  { key: 'veganskt', labelKey: 'recipeCat.vegan', Icon: SproutIcon },
]


export function RecipeIllustration({ kind, bg }: { kind: IllustrationKey; bg: string }) {
  return (
    <div className={`w-16 h-16 ${bg} rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden`}>
      <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
        {kind === 'bowl' && (
          <>
            {/* Bowl */}
            <ellipse cx="32" cy="40" rx="22" ry="8" fill="#fde68a" />
            <path d="M10 36 Q32 52 54 36" fill="#fbbf24" />
            {/* Fruit dots */}
            <circle cx="24" cy="30" r="5" fill="#f87171" />
            <circle cx="34" cy="27" r="4" fill="#fb923c" />
            <circle cx="43" cy="31" r="4" fill="#4ade80" />
            <circle cx="22" cy="38" r="3" fill="#a78bfa" />
          </>
        )}
        {kind === 'wok' && (
          <>
            {/* Wok pan */}
            <ellipse cx="32" cy="44" rx="20" ry="6" fill="#d97706" />
            <path d="M12 40 Q32 54 52 40 L52 36 Q32 50 12 36 Z" fill="#fbbf24" />
            {/* Noodle waves */}
            <path d="M18 34 Q24 30 30 34 Q36 38 42 34" fill="none" stroke="#fef3c7" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M20 38 Q26 34 32 38 Q38 42 44 38" fill="none" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" />
            {/* Veggies */}
            <circle cx="26" cy="33" r="3" fill="#4ade80" />
            <circle cx="40" cy="36" r="3" fill="#f87171" />
          </>
        )}
        {kind === 'salmon' && (
          <>
            {/* Plate */}
            <ellipse cx="32" cy="44" rx="22" ry="7" fill="#e7e5e4" />
            {/* Salmon fillet */}
            <path d="M16 38 Q22 28 38 32 Q46 34 48 40 Q38 44 16 38 Z" fill="#fb923c" />
            <path d="M18 38 Q26 32 40 35" fill="none" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" />
            {/* Herbs */}
            <circle cx="44" cy="37" r="3" fill="#4ade80" />
            <circle cx="40" cy="42" r="2" fill="#86efac" />
            {/* Lemon */}
            <ellipse cx="22" cy="43" rx="5" ry="3" fill="#fde047" />
          </>
        )}
        {kind === 'balls' && (
          <>
            {/* 3 balls */}
            <circle cx="22" cy="38" r="10" fill="#a16207" />
            <circle cx="22" cy="38" r="10" fill="none" stroke="#854d0e" strokeWidth="1" />
            <circle cx="38" cy="36" r="10" fill="#92400e" />
            <circle cx="30" cy="48" r="8" fill="#78350f" />
            {/* Texture dots */}
            <circle cx="19" cy="35" r="1.5" fill="#fef3c7" opacity="0.6" />
            <circle cx="35" cy="33" r="1.5" fill="#fef3c7" opacity="0.6" />
            <circle cx="27" cy="46" r="1.5" fill="#fef3c7" opacity="0.6" />
          </>
        )}
        {kind === 'oats' && (
          <>
            {/* Jar */}
            <rect x="18" y="24" width="28" height="30" rx="5" fill="#fefce8" stroke="#d97706" strokeWidth="1.5" />
            {/* Oat circles */}
            <ellipse cx="32" cy="32" rx="4" ry="2" fill="#d97706" opacity="0.7" />
            <ellipse cx="25" cy="36" rx="3" ry="1.5" fill="#d97706" opacity="0.7" />
            <ellipse cx="39" cy="35" rx="3" ry="1.5" fill="#d97706" opacity="0.7" />
            <ellipse cx="30" cy="40" rx="4" ry="2" fill="#d97706" opacity="0.5" />
            {/* Berries on top */}
            <circle cx="26" cy="27" r="3" fill="#f87171" />
            <circle cx="34" cy="25" r="3" fill="#4ade80" />
            <circle cx="40" cy="28" r="2.5" fill="#c084fc" />
            {/* Jar lid */}
            <rect x="16" y="20" width="32" height="6" rx="3" fill="#d97706" />
          </>
        )}
      </svg>
    </div>
  )
}

/**
 * Flikvärdena är svenska med AVSIKT: de matchas mot recepttaggarna i datan
 * (`r.tags.includes(activeTab)`). Översätts värdet slutar filtreringen
 * fungera — bara etiketten går via ordlistan.
 */
const MEAL_TABS = ['Alla', 'Frukost', 'Lunch', 'Middag', 'Mellanmål'] as const
type MealTab = typeof MEAL_TABS[number]

/** Svenskt flikvärde → etikett i ordlistan. */
const MEAL_TAB_KEYS: Record<MealTab, TextKey> = {
  'Alla': 'tab.all',
  'Frukost': 'meal.frukost',
  'Lunch': 'meal.lunch',
  'Middag': 'meal.middag',
  'Mellanmål': 'meal.mellanmar',
}

// Vald måltidsflik → meal_type som AI:n får (styr att t.ex. frukost blir
// frukostmat, inte lammfärsbiffar).
const MEAL_TYPE_MAP: Record<Exclude<MealTab, 'Alla'>, string> = {
  Frukost: 'frukost',
  Lunch: 'lunch',
  Middag: 'middag',
  Mellanmål: 'mellanmål',
}

const RECIPE_PROMPT_KEYS: TextKey[] = [
  'recipes.prompt1',
  'recipes.prompt2',
  'recipes.prompt3',
  'recipes.prompt4',
]

// AI-generated recipe based on the user's calorie/macro goals and allergies.
function AiRecipeGenerator({ mealTab }: { mealTab: MealTab }) {
  const { t } = useT()
  const [prompt, setPrompt] = useState('')
  const [kcal, setKcal] = useState<string>('')
  const [minProtein, setMinProtein] = useState<string>('')
  const [allergies, setAllergies] = useState<string[]>([])
  const [category, setCategory] = useState<RecipeCategory | null>(null)
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefill calorie target + allergies from the user's profile.
  useEffect(() => {
    api
      .getProfile()
      .then(({ profile }) => {
        const p = profile as { calorie_goal?: number | null; allergies?: string[] } | null
        if (p?.calorie_goal) setKcal(String(p.calorie_goal))
        if (p?.allergies?.length) setAllergies(p.allergies)
      })
      .catch(() => {})
  }, [])

  async function generate(text?: string) {
    if (loading) return
    // Kategori och eget önskemål är båda valfria. Faller tillbaka på vald
    // kategori, annars ett helt fritt ("överraska mig")-recept.
    const catKey = category ? RECIPE_CATEGORIES.find((c) => c.key === category)?.labelKey : undefined
    const catLabel = catKey ? t(catKey) : ''
    const p = (text ?? prompt).trim() || (catLabel ? t('recipes.categoryPrompt', { category: catLabel.toLowerCase() }) : t('recipes.surpriseMe'))
    if (text) setPrompt(text)
    setLoading(true)
    setError(null)
    try {
      const { recipe } = await api.generateRecipe({
        prompt: p,
        calorie_target: kcal ? Number(kcal) : null,
        min_protein_g: minProtein ? Number(minProtein) : null,
        allergies,
        category,
        meal_type: mealTab !== 'Alla' ? MEAL_TYPE_MAP[mealTab] : null,
      })
      setRecipe(recipe)
    } catch (e) {
      setError((e as Error).message || t('recipes.generateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const macros = recipe
    ? [
        { label: 'Kalorier', value: recipe.kcal, unit: 'kcal', color: 'bg-forest-50 dark:bg-forest-900/30 text-forest-800 dark:text-forest-300' },
        { label: 'Protein', value: recipe.protein_g, unit: 'g', color: 'bg-blue-50 dark:bg-blue-900/25 text-blue-800 dark:text-blue-300' },
        { label: 'Fett', value: recipe.fat_g, unit: 'g', color: 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-300' },
        { label: 'Kolhyd.', value: recipe.carbs_g, unit: 'g', color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300' },
      ]
    : []

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-forest-50 dark:bg-forest-900/30 flex items-center justify-center">
          <ZapIcon className="w-4 h-4 stroke-forest-600" />
        </div>
        <div>
          <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm">{t('recipes.createWithAi')}</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            {mealTab !== 'Alla' ? `${mealTab} · anpassat efter dina mål` : t('recipes.tailoredToGoals')}
          </p>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Beskriv vad du är sugen på, t.ex. ”Ge mig en middag med 700 kcal och minst 50 g protein”"
        rows={3}
        className="w-full bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-forest-400 resize-none"
      />

      {/* Kategori — styr huvudråvara/kosthållning */}
      <div className="mt-3">
        <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium mb-1.5">Kategori</p>
        <div className="flex flex-wrap gap-2">
          {RECIPE_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory((cur) => (cur === c.key ? null : c.key))}
              disabled={loading}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors disabled:opacity-50 ${
                category === c.key
                  ? 'bg-forest-700 text-white border-forest-700'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-forest-300'
              }`}
            >
              <c.Icon className="w-3.5 h-3.5" />
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {RECIPE_PROMPT_KEYS.map((promptKey) => (
          <button
            key={promptKey}
            onClick={() => generate(t(promptKey))}
            disabled={loading}
            className="text-[11px] bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1.5 text-stone-600 dark:text-stone-300 hover:border-forest-300 hover:text-forest-700 dark:hover:text-forest-300 transition-colors disabled:opacity-50"
          >
            {t(promptKey)}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <div className="flex-1">
          <label className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">{t('recipes.kcalPerServing')}</label>
          <input
            type="number"
            inputMode="numeric"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder="valfritt"
            className="w-full bg-stone-100 dark:bg-stone-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">{t('recipes.minProtein')}</label>
          <input
            type="number"
            inputMode="numeric"
            value={minProtein}
            onChange={(e) => setMinProtein(e.target.value)}
            placeholder="valfritt"
            className="w-full bg-stone-100 dark:bg-stone-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
        </div>
      </div>

      {allergies.length > 0 && (
        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2">Undviker: {allergies.join(', ')}</p>
      )}

      <button
        onClick={() => generate()}
        disabled={loading}
        className="w-full mt-3 bg-forest-700 hover:bg-forest-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {loading ? 'Skapar recept…' : 'Generera recept'}
      </button>

      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}

      {recipe && (
        <div className="mt-4 border-t border-stone-200 dark:border-stone-700 pt-4">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{recipe.name}</h3>
          <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1 mb-3">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5 stroke-stone-500 dark:stroke-stone-400" />
              {recipe.prep_minutes} min
            </span>
            <span>·</span>
            <span>{recipe.servings} {recipe.servings === 1 ? 'portion' : 'portioner'}</span>
            {recipe.tags?.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] bg-forest-50 dark:bg-forest-900/30 text-forest-800 dark:text-forest-300 px-2 py-0.5 rounded-full font-medium">
                {t}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {macros.map((m) => (
              <div key={m.label} className={`${m.color} rounded-xl p-2.5 text-center`}>
                <p className="font-bold text-sm">{m.value}</p>
                <p className="text-[10px] opacity-70">{m.unit}</p>
                <p className="text-[10px] font-medium mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Ingredienser</p>
          <ul className="space-y-1.5 mb-4">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-400 flex-shrink-0" />
                {ing}
              </li>
            ))}
          </ul>

          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Tillagning</p>
          <ol className="space-y-2">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-stone-700 dark:text-stone-300">
                <span className="w-5 h-5 rounded-full bg-forest-700 text-white text-xs flex items-center justify-center flex-shrink-0 font-semibold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <button
            onClick={() => generate()}
            disabled={loading}
            className="w-full mt-4 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-500 dark:text-stone-400 font-medium hover:border-forest-400 hover:text-forest-600 transition-colors disabled:opacity-50"
          >
            {t('recipes.generateAnother')}
          </button>
        </div>
      )}
    </div>
  )
}

export function RecipesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<MealTab>('Alla')
  const { t, lang } = useT()
  const RECIPES = recipes(lang)

  const filtered = RECIPES.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchTab = activeTab === 'Alla' || r.tags.includes(activeTab)
    return matchSearch && matchTab
  })

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-5 pt-header pb-4 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-500 dark:stroke-stone-400" />
          Mer
        </button>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t('more.recipes')}</h1>

        {/* Search */}
        <div className="relative mt-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 stroke-stone-500 dark:stroke-stone-400" viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('recipes.search')}
            className="w-full bg-stone-100 dark:bg-stone-700 rounded-xl pl-9 pr-4 py-2.5 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
        </div>

        {/* Meal tabs — wrap so inget kapas (t.ex. "Mellanmål") på smala skärmar */}
        <div className="flex flex-wrap gap-2 mt-3">
          {MEAL_TABS.map((tabValue) => (
            <button
              key={tabValue}
              onClick={() => setActiveTab(tabValue)}
              className={`text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${
                activeTab === tabValue ? 'bg-forest-700 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}
            >
              {t(MEAL_TAB_KEYS[tabValue])}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-3">
        <AiRecipeGenerator mealTab={activeTab} />

        {filtered.length === 0 && (
          <p className="text-center text-stone-500 dark:text-stone-400 text-sm py-8">{t('recipes.noneFound')}</p>
        )}

        {filtered.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => navigate(`/mer/recept/${recipe.id}`)}
            className="w-full flex items-center gap-4 px-4 py-4 text-left bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 active:bg-stone-100 dark:active:bg-stone-700 transition-colors"
          >
            <RecipeIllustration kind={recipe.illustration} bg={recipe.bg} />

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm leading-tight">{recipe.name}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                  <ClockIcon className="w-3 h-3 stroke-stone-500 dark:stroke-stone-400" />
                  {recipe.prepMinutes} min
                </span>
                <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                  <FireIcon className="w-3 h-3 stroke-stone-500 dark:stroke-stone-400" />
                  {recipe.calories} kcal
                </span>
              </div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-forest-50 dark:bg-forest-900/30 text-forest-800 dark:text-forest-300 px-2 py-0.5 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <ChevronRightIcon className="w-4 h-4 stroke-stone-300 dark:stroke-stone-600 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
