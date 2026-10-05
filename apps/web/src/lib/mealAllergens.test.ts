import { describe, it, expect } from 'vitest'
import { FOOD_ALLERGENS, isFoodAllowed } from './mealAllergens'
import { generateMealPlan } from './mealPlanGenerator'

/**
 * Allergifiltret i veckoplaneraren.
 *
 * Buggen det rättar: onboardingen frågar efter allergier, men den lokala
 * generatorn plockade ur en lista utan allergeninformation. Den kunde servera
 * ägg och kvarg till någon som kryssat ägg och laktos.
 */
describe('isFoodAllowed', () => {
  it('släpper igenom allt när inga hänsyn finns', () => {
    expect(isFoodAllowed('Ägg (kokt)', [])).toBe(true)
    expect(isFoodAllowed('Vad som helst', [])).toBe(true)
  })

  it('utesluter livsmedel med det taggade allergenet', () => {
    expect(isFoodAllowed('Ägg (kokt)', ['Ägg'])).toBe(false)
    expect(isFoodAllowed('Kvarg (naturell)', ['Laktos'])).toBe(false)
    expect(isFoodAllowed('Fullkornsbröd', ['Gluten'])).toBe(false)
    expect(isFoodAllowed('Laxfilé', ['Fisk'])).toBe(false)
    expect(isFoodAllowed('Tofu', ['Soja'])).toBe(false)
  })

  it('låter orelaterade livsmedel passera', () => {
    expect(isFoodAllowed('Banan', ['Ägg', 'Laktos', 'Gluten'])).toBe(true)
    expect(isFoodAllowed('Ris (kokt)', ['Nötter'])).toBe(true)
  })

  /**
   * Fällan som motiverar en explicit karta i stället för nyckelordsmatchning:
   * "Nötkött" är biff. En sökning på "nöt" hade uteslutit kött för
   * nötallergiker — och gett dem mandlar om stavningen avvek.
   */
  it('förväxlar inte Nötkött med nötter', () => {
    expect(isFoodAllowed('Nötkött (mager)', ['Nötter'])).toBe(true)
    expect(isFoodAllowed('Mandlar', ['Nötter'])).toBe(false)
    expect(isFoodAllowed('Valnötter', ['Nötter'])).toBe(false)
    expect(isFoodAllowed('Jordnötssmör', ['Nötter'])).toBe(false)
  })

  it('vegetarian utesluter kött och fisk men inte mejeri', () => {
    expect(isFoodAllowed('Kycklingbröst', ['Vegetarian'])).toBe(false)
    expect(isFoodAllowed('Laxfilé', ['Vegetarian'])).toBe(false)
    expect(isFoodAllowed('Kvarg (naturell)', ['Vegetarian'])).toBe(true)
    expect(isFoodAllowed('Ägg (kokt)', ['Vegetarian'])).toBe(true)
  })

  it('vegan utesluter även mejeri och ägg', () => {
    expect(isFoodAllowed('Kvarg (naturell)', ['Vegan'])).toBe(false)
    expect(isFoodAllowed('Ägg (kokt)', ['Vegan'])).toBe(false)
    expect(isFoodAllowed('Tofu', ['Vegan'])).toBe(true)
  })

  // Quorn innehåller äggvita — lätt att tro att den är vegansk.
  it('Quorn räknas inte som vegansk', () => {
    expect(isFoodAllowed('Kyckling–ersättning (Quorn)', ['Vegan'])).toBe(false)
    expect(isFoodAllowed('Kyckling–ersättning (Quorn)', ['Ägg'])).toBe(false)
  })

  /**
   * Ett livsmedel utan taggar räknas som otillåtet när hänsyn finns. Strikt
   * med avsikt: ett nytt livsmedel ska inte tyst hamna hos en allergiker.
   */
  it('okänt livsmedel utesluts när hänsyn finns', () => {
    expect(isFoodAllowed('Något nytt vi lagt in', ['Gluten'])).toBe(false)
  })
})

/**
 * Det test som gör kartan underhållbar: lägger någon in ett livsmedel i
 * mealPlanGenerator utan att tagga det, fälls bygget här i stället för att
 * livsmedlet tyst utesluts för alla med hänsyn.
 */
describe('täckning', () => {
  it('varje livsmedel i planeraren har taggar', async () => {
    const { readFileSync } = await import('node:fs')
    const text = readFileSync(new URL('./mealPlanGenerator.ts', import.meta.url), 'utf8')
    const names = [...new Set([...text.matchAll(/\['([^']+)',\s*[\d.]+/g)].map((m) => m[1]!))]
    expect(names.length).toBeGreaterThan(40)
    const untagged = names.filter((n) => FOOD_ALLERGENS[n] === undefined)
    expect(untagged, 'livsmedel utan allergentaggar').toEqual([])
  })
})

describe('generateMealPlan med hänsyn', () => {
  const names = (plan: ReturnType<typeof generateMealPlan>) =>
    plan.meals.flatMap((m) => m.foods.map((f) => f.name))

  it('utan hänsyn fungerar som förut', () => {
    const plan = generateMealPlan(2000, 3, 'balanced', 0)
    expect(names(plan).length).toBeGreaterThan(0)
  })

  it('serverar inte ägg till den som kryssat ägg', () => {
    for (const variation of [0, 1, 2, 3, 4, 5, 6]) {
      const plan = generateMealPlan(2000, 4, 'balanced', variation, ['Ägg'])
      for (const n of names(plan)) {
        expect(FOOD_ALLERGENS[n]?.includes('Ägg'), `${n} (variation ${variation})`).not.toBe(true)
      }
    }
  })

  it('klarar flera hänsyn samtidigt', () => {
    const plan = generateMealPlan(2200, 5, 'balanced', 0, ['Laktos', 'Gluten', 'Nötter'])
    for (const n of names(plan)) {
      const tags = FOOD_ALLERGENS[n] ?? []
      expect(tags).not.toContain('Laktos')
      expect(tags).not.toContain('Gluten')
      expect(tags).not.toContain('Nötter')
    }
  })

  // Hårdaste fallet: vegan utesluter kött, fisk, mejeri och ägg på en gång.
  it('ger fortfarande mat till en vegan', () => {
    const plan = generateMealPlan(2000, 3, 'vegetarian', 0, ['Vegan'])
    expect(names(plan).length).toBeGreaterThan(0)
  })
})
