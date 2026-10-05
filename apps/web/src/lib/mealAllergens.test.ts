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

/**
 * Att filtret FINNS räcker inte — det måste vara i kraft när planen skapas.
 *
 * Buggen: useRestrictions hämtar profilens hänsyn asynkront och började på en
 * tom lista, och tom lista betyder "filtrera inte". Tryckte användaren på
 * Generera innan hämtningen svarat fick hen en matsedel UTAN filtrering: ägg
 * och kvarg till någon som kryssat ägg och laktos. Precis den bugg filtret
 * rättar, återuppstådd genom ett tidsglapp.
 *
 * Hooken returnerar nu `loaded`, och varje sida som genererar måste blockera
 * på den. Testet läser källan eftersom projektet inte har jsdom — det kan
 * alltså inte rendera och klicka, men det fångar en ny sida som glömmer
 * grinden.
 */
describe('genereringen är blockerad tills hänsynen är kända', () => {
  it('varje sida som anropar generateMealPlan grindar på restrictionsLoaded', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs')
    const { join } = await import('node:path')
    const { fileURLToPath } = await import('node:url')

    const root = fileURLToPath(new URL('../pages', import.meta.url))
    const files: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir)) {
        const full = join(dir, e)
        if (statSync(full).isDirectory()) walk(full)
        else if (e.endsWith('.tsx')) files.push(full)
      }
    }
    walk(root)

    const callers = files.filter((f) => readFileSync(f, 'utf8').includes('generateMealPlan('))
    // Utan det här skulle testet passera om filerna döptes om.
    expect(callers.length).toBeGreaterThan(0)

    const ungated = callers.filter((f) => {
      const text = readFileSync(f, 'utf8')
      return !text.includes('restrictionsLoaded')
    })
    expect(ungated.map((f) => f.slice(root.length)), 'blockera knappen på !restrictionsLoaded').toEqual([])
  })

  it('hooken kan inte användas utan att se om hänsynen är kända', async () => {
    const { readFileSync } = await import('node:fs')
    const { fileURLToPath } = await import('node:url')
    const hook = readFileSync(fileURLToPath(new URL('../hooks/useRestrictions.ts', import.meta.url)), 'utf8')
    // Returtypen är ett objekt, inte en array: en anropare MÅSTE se status för
    // att komma åt listan. Blir den en naken string[] igen är grinden borta.
    expect(hook).toMatch(/export function useRestrictions\(\): Restrictions/)
    expect(hook).toMatch(/ready: status === 'ready'/)
  })

  /**
   * FAIL CLOSED: ett nätverksfel får inte se ut som "inga hänsyn".
   *
   * Hooken satte tidigare `loaded: true` i sin catch, med en tom lista — och
   * tom lista betyder "filtrera inte". Ett misslyckat anrop gav alltså en
   * ofiltrerad matsedel, vilket var hela buggen. Catch-grenen måste sätta
   * 'failed', aldrig 'ready'.
   */
  it('ett nätverksfel ger status failed, inte ready', async () => {
    const { readFileSync } = await import('node:fs')
    const { fileURLToPath } = await import('node:url')
    const hook = readFileSync(fileURLToPath(new URL('../hooks/useRestrictions.ts', import.meta.url)), 'utf8')
    const katch = hook.slice(hook.indexOf('.catch('))
    expect(katch).toMatch(/setStatus\('failed'\)/)
    expect(katch).not.toMatch(/setStatus\('ready'\)/)
  })
})
