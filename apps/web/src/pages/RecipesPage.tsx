import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, BookOpenIcon, ClockIcon, FireIcon } from '../components/ui/Icons'

interface Recipe {
  id: string
  name: string
  calories: number
  prepMinutes: number
  servings: number
  tags: string[]
  ingredients: string[]
  instructions: string[]
}

const RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Proteinpannkakor',
    calories: 420,
    prepMinutes: 15,
    servings: 2,
    tags: ['Frukost', 'Hög protein'],
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
    name: 'Kycklinglåda med quinoa',
    calories: 560,
    prepMinutes: 25,
    servings: 1,
    tags: ['Lunch', 'Middag', 'Hög protein'],
    ingredients: [
      '150 g kycklingfilé',
      '1 dl quinoa',
      '1 paprika',
      '½ gurka',
      '2 msk olivolja',
      'Salt, peppar, oregano',
    ],
    instructions: [
      'Koka quinoa enligt förpackning.',
      'Skär kycklingen i bitar och stek i olivolja med kryddor ca 8 min.',
      'Hacka paprika och gurka.',
      'Blanda quinoa, grönsaker och kyckling i en bowl.',
    ],
  },
  {
    id: '3',
    name: 'Smoothiebowl',
    calories: 350,
    prepMinutes: 10,
    servings: 1,
    tags: ['Frukost', 'Vegetarisk'],
    ingredients: [
      '1 banan (fryst)',
      '1 dl frysta bär',
      '1 dl mjölk',
      '2 msk jordnötssmör',
      'Topping: granola, färska bär',
    ],
    instructions: [
      'Mixa banan, bär och mjölk till en tjock smoothie.',
      'Häll i en skål.',
      'Toppa med granola och färska bär.',
    ],
  },
  {
    id: '4',
    name: 'Laxpasta med spenat',
    calories: 620,
    prepMinutes: 20,
    servings: 2,
    tags: ['Middag', 'Omega-3'],
    ingredients: [
      '200 g laxfilé',
      '200 g pasta',
      '2 nävar spenat',
      '1 dl crème fraiche',
      '2 vitlöksklyftor',
      'Citron, dill',
    ],
    instructions: [
      'Koka pasta enligt förpackning.',
      'Stek lax i smör 3–4 min per sida, plocka isär i bitar.',
      'Fräs vitlök i pannan, tillsätt crème fraiche och spenat.',
      'Blanda pasta, lax och sås. Pressa citron och toppa med dill.',
    ],
  },
  {
    id: '5',
    name: 'Overnight oats',
    calories: 380,
    prepMinutes: 5,
    servings: 1,
    tags: ['Frukost', 'Snabb'],
    ingredients: [
      '1 dl havregryn',
      '1.5 dl mjölk',
      '1 msk chiafrön',
      '1 msk honung',
      'Bär eller frukt till topping',
    ],
    instructions: [
      'Blanda havregryn, mjölk, chiafrön och honung i en burk.',
      'Rör om väl.',
      'Ställ i kylskåpet overnight (minst 6 timmar).',
      'Toppa med bär eller frukt innan servering.',
    ],
  },
]

const ALL_TAGS = Array.from(new Set(RECIPES.flatMap((r) => r.tags)))

export function RecipesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = RECIPES.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchTag = !activeTag || r.tags.includes(activeTag)
    return matchSearch && matchTag
  })

  return (
    <div className="px-5 pt-12 pb-4">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Recept</h1>
      <p className="text-stone-400 text-sm mb-5">Hälsosamma recept anpassade för dina mål.</p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Sök recept…"
        className="w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 mb-3"
      />

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5">
        <button
          onClick={() => setActiveTag(null)}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
            !activeTag ? 'bg-forest-600 text-white' : 'bg-stone-100 text-stone-600'
          }`}
        >
          Alla
        </button>
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
              activeTag === tag ? 'bg-forest-600 text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-stone-400 text-sm py-6">Inga recept hittades.</p>
      )}

      <div className="space-y-3">
        {filtered.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)}
              className="w-full flex items-start gap-3 px-4 py-4 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center flex-shrink-0">
                <BookOpenIcon className="w-5 h-5 stroke-forest-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-900 text-sm">{recipe.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <FireIcon className="w-3 h-3 stroke-stone-400" />
                    {recipe.calories} kcal
                  </span>
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <ClockIcon className="w-3 h-3 stroke-stone-400" />
                    {recipe.prepMinutes} min
                  </span>
                  <span className="text-xs text-stone-400">{recipe.servings} port.</span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {recipe.tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-forest-50 text-forest-700 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronLeftIcon
                className={`w-4 h-4 stroke-stone-300 flex-shrink-0 mt-1 transition-transform ${
                  expanded === recipe.id ? '-rotate-90' : 'rotate-180'
                }`}
              />
            </button>

            {expanded === recipe.id && (
              <div className="px-4 pb-4 border-t border-stone-50">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mt-3 mb-2">Ingredienser</p>
                <ul className="space-y-1">
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
