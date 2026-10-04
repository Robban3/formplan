/**
 * De inbyggda recepten, per språk.
 *
 * Ligger här och inte i lib/i18n av samma skäl som FAQ:n — ordlistan är för
 * korta gränssnittssträngar, inte för ingredienslistor och instruktioner.
 *
 * Två saker skiljer språken åt utöver orden:
 *
 * - `tags` är SVENSKA i båda. De matchas mot flikfiltret på receptsidan
 *   (`r.tags.includes(activeTab)`), så ett översatt värde skulle tömma
 *   filtret. Etiketten översätts via MEAL_TAB_KEYS.
 * - Måtten skrivs om för engelska. "2 dl" och "1 msk" är nordiska enheter som
 *   en engelsk läsare inte har någon känsla för; ml, g och tbsp förstås
 *   överallt. Mängderna är desamma, bara uttryckta annorlunda.
 *
 * `id`, näringsvärden, bild och bakgrund är språkoberoende och delas.
 */

import type { Lang } from '../i18n'

export type IllustrationKey = 'bowl' | 'wok' | 'salmon' | 'balls' | 'oats'

export interface Recipe {
  id: string
  name: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  prepMinutes: number
  servings: number
  /** Svenska i båda språken — matchas mot flikfiltret. */
  tags: string[]
  illustration: IllustrationKey
  bg: string
  ingredients: string[]
  instructions: string[]
}

/** Det som inte beror på språk. */
const SHARED = [
  { id: '1', calories: 420, protein_g: 28, fat_g: 14, carbs_g: 42, prepMinutes: 20, servings: 2,
    tags: ['Frukost'], illustration: 'bowl' as IllustrationKey, bg: 'bg-amber-50 dark:bg-amber-900/25' },
  { id: '2', calories: 550, protein_g: 45, fat_g: 16, carbs_g: 52, prepMinutes: 30, servings: 1,
    tags: ['Lunch', 'Middag'], illustration: 'wok' as IllustrationKey, bg: 'bg-orange-50' },
  { id: '3', calories: 600, protein_g: 40, fat_g: 30, carbs_g: 40, prepMinutes: 35, servings: 2,
    tags: ['Middag'], illustration: 'salmon' as IllustrationKey, bg: 'bg-orange-50' },
  { id: '4', calories: 180, protein_g: 12, fat_g: 8, carbs_g: 16, prepMinutes: 15, servings: 6,
    tags: ['Mellanmål'], illustration: 'balls' as IllustrationKey, bg: 'bg-amber-50 dark:bg-amber-900/25' },
  { id: '5', calories: 380, protein_g: 14, fat_g: 9, carbs_g: 58, prepMinutes: 5, servings: 1,
    tags: ['Frukost'], illustration: 'oats' as IllustrationKey, bg: 'bg-yellow-50' },
]

type Text = Pick<Recipe, 'name' | 'ingredients' | 'instructions'>

const SV: Text[] = [
  {
    name: 'Proteinfruktskål',
    ingredients: ['2 dl kvarg', '1 banan', '1 dl blåbär', '½ dl havregryn', '1 msk honung', '1 msk mandlar'],
    instructions: [
      'Lägg kvargen i en skål.',
      'Skiva bananen och strö över blåbären.',
      'Toppa med havregryn och grovhackade mandlar.',
      'Ringla över honung och servera direkt.',
    ],
  },
  {
    name: 'Kycklingwok med nudlar',
    ingredients: ['150 g kycklingfilé', '1 dl quinoa', '1 paprika', '½ gurka', '2 msk olivolja', 'Salt, peppar, oregano'],
    instructions: [
      'Koka quinoa enligt förpackning.',
      'Skär kycklingen i bitar och stek i olivolja med kryddor ca 8 min.',
      'Hacka paprika och gurka.',
      'Blanda quinoa, grönsaker och kyckling i en bowl.',
    ],
  },
  {
    name: 'Lax med ugnsrostade grönsaker',
    ingredients: ['200 g laxfilé', '2 sötpotatisar', '1 broccoli', '1 paprika', '2 msk olivolja', 'Citron, dill, salt, peppar'],
    instructions: [
      'Sätt ugnen på 200 °C.',
      'Skär sötpotatis, broccoli och paprika i bitar, ringla över olivolja och krydda.',
      'Rosta grönsakerna i ugnen ca 20 min.',
      'Lägg i laxen de sista 12–15 min. Servera med citron och dill.',
    ],
  },
  {
    name: 'Proteinbollar',
    ingredients: ['2 dl havregryn', '2 msk jordnötssmör', '1 skopa proteinpulver', '1 msk honung', '1 msk kakao'],
    instructions: [
      'Mixa havregryn, jordnötssmör, proteinpulver, honung och kakao till en jämn smet.',
      'Tillsätt någon tesked vatten om smeten är för torr.',
      'Rulla smeten till ca 12 jämnstora bollar.',
      'Låt stå i kylen minst 30 min innan servering.',
    ],
  },
  {
    name: 'Overnight oats',
    ingredients: ['1 dl havregryn', '1,5 dl mjölk', '1 msk chiafrön', '1 msk honung', 'Bär eller frukt till topping'],
    instructions: [
      'Blanda havregryn, mjölk, chiafrön och honung i en burk.',
      'Rör om väl.',
      'Ställ i kylskåpet över natten (minst 6 timmar).',
      'Toppa med bär eller frukt innan servering.',
    ],
  },
]

const EN: Text[] = [
  {
    name: 'Protein fruit bowl',
    ingredients: ['200 ml quark', '1 banana', '100 ml blueberries', '50 ml rolled oats', '1 tbsp honey', '1 tbsp almonds'],
    instructions: [
      'Spoon the quark into a bowl.',
      'Slice the banana and scatter the blueberries over it.',
      'Top with the oats and roughly chopped almonds.',
      'Drizzle over the honey and serve straight away.',
    ],
  },
  {
    name: 'Chicken stir-fry with quinoa',
    ingredients: ['150 g chicken breast', '100 ml quinoa', '1 bell pepper', '½ cucumber', '2 tbsp olive oil', 'Salt, pepper, oregano'],
    instructions: [
      'Cook the quinoa according to the packet.',
      'Cut the chicken into pieces and fry in olive oil with the spices for about 8 minutes.',
      'Chop the bell pepper and cucumber.',
      'Combine the quinoa, vegetables and chicken in a bowl.',
    ],
  },
  {
    name: 'Salmon with oven-roasted vegetables',
    ingredients: ['200 g salmon fillet', '2 sweet potatoes', '1 head of broccoli', '1 bell pepper', '2 tbsp olive oil', 'Lemon, dill, salt, pepper'],
    instructions: [
      'Heat the oven to 200 °C (390 °F).',
      'Cut the sweet potato, broccoli and pepper into pieces, drizzle with olive oil and season.',
      'Roast the vegetables for about 20 minutes.',
      'Add the salmon for the last 12–15 minutes. Serve with lemon and dill.',
    ],
  },
  {
    name: 'Protein balls',
    ingredients: ['200 ml rolled oats', '2 tbsp peanut butter', '1 scoop protein powder', '1 tbsp honey', '1 tbsp cocoa'],
    instructions: [
      'Blend the oats, peanut butter, protein powder, honey and cocoa into a smooth mixture.',
      'Add a teaspoon of water if the mixture is too dry.',
      'Roll into about 12 evenly sized balls.',
      'Chill for at least 30 minutes before serving.',
    ],
  },
  {
    name: 'Overnight oats',
    ingredients: ['100 ml rolled oats', '150 ml milk', '1 tbsp chia seeds', '1 tbsp honey', 'Berries or fruit to top'],
    instructions: [
      'Mix the oats, milk, chia seeds and honey in a jar.',
      'Stir well.',
      'Leave in the fridge overnight (at least 6 hours).',
      'Top with berries or fruit before serving.',
    ],
  },
]

export function recipes(lang: Lang): Recipe[] {
  const texts = lang === 'sv' ? SV : EN
  return SHARED.map((shared, i) => ({ ...shared, ...texts[i]! }))
}
