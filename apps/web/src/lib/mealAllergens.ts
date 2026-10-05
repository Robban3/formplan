/**
 * Allergener och kosthänsyn per livsmedel i veckoplaneraren.
 *
 * Varför filen finns: onboardingen frågar efter allergier, men
 * `generateMealPlan` i mealPlanGenerator.ts är en LOKAL generator som plockar
 * ur en fast lista — och listan hade ingen allergeninformation alls. Den kunde
 * servera "Ägg (kokt)" och "Kvarg (naturell)" till någon som kryssat ägg och
 * laktos. Samma strukturella fel som schemagenereringen hade med utrustning:
 * villkoret samlas in, men generatorn kan inte se det.
 *
 * Nycklarna är onboardingens värden (apps/web/src/pages/OnboardingPage.tsx):
 * Gluten, Laktos, Nötter, Ägg, Fisk, Soja, Vegetarian, Vegan.
 *
 * 'Vegetarian' och 'Vegan' är preferenser, inte allergier, men ligger i samma
 * lista i profilen och hanteras därför likadant: de utesluter livsmedel.
 *
 * VARFÖR EN EXPLICIT KARTA och inte nyckelordsmatchning: "Nötkött" är biff.
 * En sökning på "nöt" hade uteslutit kött för nötallergiker och lämnat
 * mandlar kvar om stavningen avvek. Det finns ett test för just det.
 *
 * Vid osäkerhet taggas HELLRE för mycket. Ett uteslutet livsmedel ger mindre
 * variation; ett som inte uteslutits kan göra någon sjuk.
 */

export type Allergen = 'Gluten' | 'Laktos' | 'Nötter' | 'Ägg' | 'Fisk' | 'Soja' | 'Vegetarian' | 'Vegan'

/**
 * Livsmedel → det som utesluter det.
 *
 * Kött och fisk taggas med både 'Vegetarian' och 'Vegan' (fisk dessutom med
 * 'Fisk'); mejeri och ägg bara med 'Vegan', eftersom en vegetarian äter dem.
 */
export const FOOD_ALLERGENS: Record<string, Allergen[]> = {
  // Frukt, bär, grönt — inget
  'Avokado': [],
  'Banan': [],
  'Blomkål': [],
  'Blåbär': [],
  'Broccoli': [],
  'Bär (blandade)': [],
  'Bönmix': [],
  'Chiafrön': [],
  'Kikärter': [],
  'Kokosmjölk': [],
  'Linser (kokta)': [],
  'Olivolja': [],
  'Paprika': [],
  'Quinoa (kokt)': [],
  'Ris (kokt)': [],
  'Spenat': [],
  'Sötpotatis': [],
  'Tomat': [],
  'Vitlök': [],
  'Äpple': [],
  // Sesam finns inte bland onboardingens val, så hummus taggas inte för det.
  'Hummus': [],

  // Gluten
  'Bröd (råg)': ['Gluten'],
  'Fullkornsbröd': ['Gluten'],
  // Havre är inte glutenhaltig i sig men sällan certifierad glutenfri i
  // Sverige. Taggas för säkerhets skull.
  'Havregrynsgröt': ['Gluten'],

  // Mejeri — vegetarianer äter det, veganer inte
  'Fetaost': ['Laktos', 'Vegan'],
  'Grädde': ['Laktos', 'Vegan'],
  'Kesella': ['Laktos', 'Vegan'],
  'Kvarg (0%)': ['Laktos', 'Vegan'],
  'Kvarg (naturell)': ['Laktos', 'Vegan'],
  'Yoghurt (naturell)': ['Laktos', 'Vegan'],
  // Vassleprotein.
  'Proteinpulver (shake)': ['Laktos', 'Vegan'],

  // Ägg
  'Kokt ägg': ['Ägg', 'Vegan'],
  'Ägg (kokt)': ['Ägg', 'Vegan'],
  'Ägg (scrambled)': ['Ägg', 'Vegan'],
  'Ägg (stekt)': ['Ägg', 'Vegan'],

  // Nötter
  'Mandlar': ['Nötter'],
  'Mandelmjölk': ['Nötter'],
  'Valnötter': ['Nötter'],
  // Jordnöt är en böna, men hanteras som nöt i all märkning.
  'Jordnötssmör': ['Nötter'],

  // Kött — OBS: "Nötkött" är biff, inte nötter.
  'Bacon (mager)': ['Vegetarian', 'Vegan'],
  'Kycklingbröst': ['Vegetarian', 'Vegan'],
  'Kycklingfilé (grillad)': ['Vegetarian', 'Vegan'],
  'Kycklingkorv': ['Vegetarian', 'Vegan'],
  'Nötkött (mager)': ['Vegetarian', 'Vegan'],

  // Fisk
  'Laxfilé': ['Fisk', 'Vegetarian', 'Vegan'],

  // Soja
  'Tofu': ['Soja'],
  // Sojalecitin är standard i mörk choklad.
  'Mörk choklad 70%': ['Soja'],
  'Mörk choklad 85%': ['Soja'],

  // Quorn innehåller äggvita och är inte vegansk.
  'Kyckling–ersättning (Quorn)': ['Ägg', 'Vegan'],

  // Innehållet varierar mellan märken; taggas brett eftersom en proteinbar
  // sällan är fri från något av det här.
  'Proteinbar': ['Gluten', 'Laktos', 'Soja', 'Nötter', 'Vegan'],
}

/**
 * Får livsmedlet ingå med de här kosthänsynen?
 *
 * Ett livsmedel som SAKNAS i kartan räknas som otillåtet när användaren har
 * något hänsyn alls. Det är avsiktligt strikt: ett nytt livsmedel utan taggar
 * ska inte tyst hamna på tallriken hos en allergiker. Testet i
 * mealAllergens.test.ts fäller bygget om ett livsmedel saknar taggar, så
 * fallet ska aldrig uppstå i praktiken.
 */
export function isFoodAllowed(name: string, restrictions: readonly string[]): boolean {
  if (restrictions.length === 0) return true
  const tags = FOOD_ALLERGENS[name]
  if (!tags) return false
  return !tags.some((tag) => restrictions.includes(tag))
}
