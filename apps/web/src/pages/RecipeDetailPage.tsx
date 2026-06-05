import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '../components/ui/Icons'

const RECIPES = [
  {
    id: '1', name: 'Proteinrik frukostskål', category: 'frukost', time_min: 10, kcal: 490,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    tags: ['Högt protein', 'Snabb'],
    protein_g: 38, fat_g: 18, carbs_g: 42,
    servings: 1,
    ingredients: [
      '200 g grekisk yoghurt (0%)', '30 g proteinpulver (vanilj)', '50 g havregryn',
      '100 g blandade bär (frysta eller färska)', '1 msk honung', '10 g valnötter',
    ],
    steps: [
      'Blanda proteinpulver med yoghurten tills det är slätt.',
      'Lägg havregryn i botten av en skål.',
      'Häll yoghurtblandningen över havregryn.',
      'Toppa med bär, valnötter och ett sting honung.',
    ],
  },
  {
    id: '2', name: 'Overnight oats med bär', category: 'frukost', time_min: 5, kcal: 380,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
    tags: ['Vegansk', 'Förbered kvällen'],
    protein_g: 14, fat_g: 9, carbs_g: 58,
    servings: 1,
    ingredients: [
      '80 g havregryn', '2 dl havremjölk', '1 msk chiafrön',
      '100 g blandade bär', '1 tsk vaniljsocker', '1 msk lönnsirap',
    ],
    steps: [
      'Blanda havregryn, havremjölk, chiafrön och vaniljsocker i en burk.',
      'Rör om ordentligt och ställ i kylen över natten.',
      'Morgonen efter, toppa med bär och lönnsirap.',
    ],
  },
  {
    id: '3', name: 'Kycklingwok med nudlar', category: 'lunch', time_min: 25, kcal: 550,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
    tags: ['Högt protein', 'Mättande'],
    protein_g: 45, fat_g: 14, carbs_g: 52,
    servings: 2,
    ingredients: [
      '400 g kycklingbröst', '200 g äggnudlar', '1 paprika', '200 g broccoli',
      '3 msk sojasås', '2 msk sesamolja', '2 vitlöksklyftor', '1 tsk ingefära (riven)',
    ],
    steps: [
      'Koka nudlarna enligt förpackning, skölj med kallt vatten.',
      'Skär kycklingen i bitar och stek i sesamolja på hög värme ca 5 min.',
      'Lägg i vitlök, ingefära, paprika och broccoli. Woka 3–4 min.',
      'Tillsätt nudlar och sojasås. Blanda och servera.',
    ],
  },
  {
    id: '4', name: 'Quinoasallad med avokado', category: 'lunch', time_min: 15, kcal: 420,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    tags: ['Vegansk', 'Glutenfri'],
    protein_g: 14, fat_g: 22, carbs_g: 44,
    servings: 2,
    ingredients: [
      '200 g quinoa (kokt)', '1 avokado', '100 g körsbärstomater',
      '50 g spenat', '2 msk olivolja', '1 citron (juice)', 'Salt och peppar',
    ],
    steps: [
      'Koka quinoa enligt förpackning och låt svalna.',
      'Skär avokado och tomater i bitar.',
      'Blanda quinoa, spenat, avokado och tomater.',
      'Ringla över olivolja och citronsaft. Krydda med salt och peppar.',
    ],
  },
  {
    id: '5', name: 'Lax med ugnsrostade grönsaker', category: 'middag', time_min: 35, kcal: 600,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    tags: ['Omega-3', 'Glutenfri'],
    protein_g: 42, fat_g: 28, carbs_g: 30,
    servings: 2,
    ingredients: [
      '2 laxfiléer (à 150 g)', '2 potatisar', '1 zucchini', '1 paprika',
      '2 msk olivolja', '1 citron', 'Dill', 'Salt och peppar',
    ],
    steps: [
      'Värm ugnen till 200°C.',
      'Skär grönsaker i bitar, blanda med olivolja, salt och peppar. Rosta 20 min.',
      'Lägg laxen på ett bakplåtspapper, krydda och pressa över citron.',
      'Lägg in laxen de sista 12–15 minuterna.',
      'Servera med dill och citronklyftor.',
    ],
  },
  {
    id: '6', name: 'Kycklingbowl med ris', category: 'middag', time_min: 30, kcal: 580,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    tags: ['Högt protein', 'Meal prep'],
    protein_g: 48, fat_g: 16, carbs_g: 55,
    servings: 2,
    ingredients: [
      '400 g kycklingbröst', '200 g jasminris', '1 avokado',
      '100 g edamame', '2 msk teriyakisås', '1 msk sesamfrön', 'Lime',
    ],
    steps: [
      'Koka riset.',
      'Stek kycklingen i teriyakisås tills genomstekt, ca 6–8 min per sida.',
      'Skiva kycklingen och avokado.',
      'Fördela ris i skålar, toppa med kyckling, avokado och edamame.',
      'Strö sesamfrön och pressa lime.',
    ],
  },
  {
    id: '7', name: 'Köttbullar med potatismos', category: 'middag', time_min: 40, kcal: 650,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    tags: ['Klassisk', 'Mättande'],
    protein_g: 38, fat_g: 32, carbs_g: 52,
    servings: 4,
    ingredients: [
      '500 g nötfärs', '1 ägg', '2 msk ströbröd', '1 gul lök',
      '600 g potatis', '1 dl mjölk', '50 g smör', 'Salt och peppar',
    ],
    steps: [
      'Blanda färs, ägg, ströbröd, hackad lök, salt och peppar. Rulla till bollar.',
      'Stek köttbullarna i smör tills de är genomstekta.',
      'Koka potatisen mjuk. Mosa med mjölk, smör, salt och peppar.',
      'Servera med lingonsylt och brunsås.',
    ],
  },
  {
    id: '8', name: 'Proteinbollar', category: 'mellanmar', time_min: 15, kcal: 180,
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&q=80',
    tags: ['Högt protein', 'Snabb'],
    protein_g: 12, fat_g: 8, carbs_g: 16,
    servings: 10,
    ingredients: [
      '150 g havregryn', '60 g proteinpulver (choklad)', '80 g jordnötssmör',
      '3 msk honung', '2 msk kakao', '2 msk kokosflingor',
    ],
    steps: [
      'Blanda alla ingredienser i en skål.',
      'Rulla till ca 10 bollar.',
      'Rulla i kokosflingor.',
      'Lägg i kylen i 30 min så de stelnar.',
    ],
  },
  {
    id: '9', name: 'Grekisk yoghurt med granola', category: 'mellanmar', time_min: 3, kcal: 220,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    tags: ['Snabb', 'Kalcium'],
    protein_g: 16, fat_g: 6, carbs_g: 26,
    servings: 1,
    ingredients: [
      '200 g grekisk yoghurt (2%)', '40 g granola', '1 msk honung',
      '50 g färska bär',
    ],
    steps: [
      'Häll yoghurten i en skål.',
      'Toppa med granola och bär.',
      'Ringla över honung.',
    ],
  },
]

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = RECIPES.find((r) => r.id === id)

  if (!recipe) {
    return (
      <div className="px-5 pt-12 text-center text-stone-400">
        <p>Receptet hittades inte.</p>
        <button onClick={() => navigate(-1)} className="text-forest-600 mt-2">Tillbaka</button>
      </div>
    )
  }

  return (
    <div className="pb-10 bg-stone-50 min-h-screen">
      {/* Hero image */}
      <div className="relative h-56 bg-stone-200">
        <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
              <svg className="w-4 h-4 stroke-stone-400" viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              {recipe.time_min} min
            </span>
            <span>·</span>
            <span>{recipe.servings} {recipe.servings === 1 ? 'portion' : 'portioner'}</span>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[
              { label: 'Kalorier', value: recipe.kcal, unit: 'kcal', color: 'bg-forest-50 text-forest-700' },
              { label: 'Protein',  value: recipe.protein_g, unit: 'g', color: 'bg-blue-50 text-blue-700' },
              { label: 'Fett',     value: recipe.fat_g,     unit: 'g', color: 'bg-amber-50 text-amber-700' },
              { label: 'Kolhyd.', value: recipe.carbs_g,   unit: 'g', color: 'bg-green-50 text-green-700' },
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
          {recipe.steps.map((step, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-stone-50' : ''}`}>
              <div className="w-6 h-6 rounded-full bg-forest-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-stone-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {/* Add to diary */}
        <button className="mt-5 w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-4 rounded-2xl transition-colors">
          Lägg till i kostdagbok
        </button>
      </div>
    </div>
  )
}
