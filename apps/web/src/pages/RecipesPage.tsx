import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, ClockIcon, FireIcon } from '../components/ui/Icons'

type IllustrationKey = 'bowl' | 'wok' | 'salmon' | 'balls' | 'oats'

interface Recipe {
  id: string
  name: string
  calories: number
  prepMinutes: number
  servings: number
  tags: string[]
  illustration: IllustrationKey
  bg: string
  ingredients: string[]
  instructions: string[]
}

function RecipeIllustration({ kind, bg }: { kind: IllustrationKey; bg: string }) {
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

const RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Proteinfruktskål',
    calories: 420,
    prepMinutes: 20,
    servings: 2,
    tags: ['Frukost'],
    illustration: 'bowl' as IllustrationKey,
    bg: 'bg-amber-50',
    ingredients: ['2 ägg', '1 dl havregryn', '1 dl kvarg', '1 banan', '1 tsk bakpulver'],
    instructions: [
      'Mixa alla ingredienser i en mixer tills smeten är slät.',
      'Hetta upp en stekpanna med lite smör på medelvärme.',
      'Häll i ca 1/4 av smeten per pannkaka.',
      'Stek 2–3 min per sida tills de är gyllenbruna.',
    ],
  },
  {
    id: '2',
    name: 'Kycklingwok med nudlar',
    calories: 550,
    prepMinutes: 30,
    servings: 1,
    tags: ['Lunch', 'Middag'],
    illustration: 'wok' as IllustrationKey,
    bg: 'bg-orange-50',
    ingredients: ['150 g kycklingfilé', '1 dl quinoa', '1 paprika', '½ gurka', '2 msk olivolja', 'Salt, peppar, oregano'],
    instructions: [
      'Koka quinoa enligt förpackning.',
      'Skär kycklingen i bitar och stek i olivolja med kryddor ca 8 min.',
      'Hacka paprika och gurka.',
      'Blanda quinoa, grönsaker och kyckling i en bowl.',
    ],
  },
  {
    id: '3',
    name: 'Lax med ugnsrostade grönsaker',
    calories: 600,
    prepMinutes: 35,
    servings: 2,
    tags: ['Middag'],
    illustration: 'salmon' as IllustrationKey,
    bg: 'bg-orange-50',
    ingredients: ['200 g laxfilé', '200 g pasta', '2 nävar spenat', '1 dl crème fraiche', '2 vitlöksklyftor', 'Citron, dill'],
    instructions: [
      'Koka pasta enligt förpackning.',
      'Stek lax i smör 3–4 min per sida, plocka isär i bitar.',
      'Fräs vitlök i pannan, tillsätt crème fraiche och spenat.',
      'Blanda pasta, lax och sås. Pressa citron och toppa med dill.',
    ],
  },
  {
    id: '4',
    name: 'Proteinbollar',
    calories: 180,
    prepMinutes: 15,
    servings: 6,
    tags: ['Mellanmål'],
    illustration: 'balls' as IllustrationKey,
    bg: 'bg-amber-50',
    ingredients: ['1 dl havregryn', '1.5 dl mjölk', '1 msk chiafrön', '1 msk honung', 'Bär eller frukt till topping'],
    instructions: [
      'Blanda havregryn, mjölk, chiafrön och honung i en burk.',
      'Rör om väl.',
      'Ställ i kylskåpet overnight (minst 6 timmar).',
      'Toppa med bär eller frukt innan servering.',
    ],
  },
  {
    id: '5',
    name: 'Overnight oats',
    calories: 380,
    prepMinutes: 5,
    servings: 1,
    tags: ['Frukost'],
    illustration: 'oats' as IllustrationKey,
    bg: 'bg-yellow-50',
    ingredients: ['1 dl havregryn', '1.5 dl mjölk', '1 msk chiafrön', '1 msk honung', 'Bär eller frukt till topping'],
    instructions: [
      'Blanda havregryn, mjölk, chiafrön och honung i en burk.',
      'Rör om väl.',
      'Ställ i kylskåpet overnight (minst 6 timmar).',
      'Toppa med bär eller frukt innan servering.',
    ],
  },
]

const MEAL_TABS = ['Alla', 'Frukost', 'Lunch', 'Middag', 'Mellanmål'] as const
type MealTab = typeof MEAL_TABS[number]

export function RecipesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<MealTab>('Alla')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = RECIPES.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchTab = activeTab === 'Alla' || r.tags.includes(activeTab)
    return matchSearch && matchTab
  })

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-stone-100">
        <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
          Mer
        </button>
        <h1 className="text-2xl font-bold text-stone-900">Recept</h1>

        {/* Search */}
        <div className="relative mt-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 stroke-stone-400" viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök recept…"
            className="w-full bg-stone-100 rounded-xl pl-9 pr-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
        </div>

        {/* Meal tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {MEAL_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-shrink-0 text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${
                activeTab === t ? 'bg-forest-600 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-8">Inga recept hittades.</p>
        )}

        {filtered.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)}
              className="w-full flex items-center gap-4 px-4 py-4 text-left"
            >
              <RecipeIllustration kind={recipe.illustration} bg={recipe.bg} />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-900 text-sm leading-tight">{recipe.name}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <ClockIcon className="w-3 h-3 stroke-stone-400" />
                    {recipe.prepMinutes} min
                  </span>
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <FireIcon className="w-3 h-3 stroke-stone-400" />
                    {recipe.calories} kcal
                  </span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {recipe.tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-forest-50 text-forest-700 px-2 py-0.5 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <ChevronLeftIcon
                className={`w-4 h-4 stroke-stone-300 flex-shrink-0 transition-transform ${
                  expanded === recipe.id ? '-rotate-90' : 'rotate-180'
                }`}
              />
            </button>

            {expanded === recipe.id && (
              <div className="px-4 pb-5 border-t border-stone-50">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mt-4 mb-2">Ingredienser</p>
                <ul className="space-y-1.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest-400 flex-shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mt-4 mb-2">Tillagning</p>
                <ol className="space-y-2">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-stone-700">
                      <span className="w-5 h-5 rounded-full bg-forest-600 text-white text-xs flex items-center justify-center flex-shrink-0 font-semibold">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
