import { describe, it, expect } from 'vitest'
import {
  EXERCISE_CATALOG,
  getExerciseById,
  matchExercise,
  allowedEquipment,
  catalogForPrompt,
  isExerciseAllowed,
} from './exerciseCatalog'

// Katalogen är GENERERAD (scripts/build-exercise-catalog.mjs) och delas med
// apps/web. Den här sviten är skyddsnätet mot att någon handredigerar den till
// något som tyst pekar fel: dubbletter bland id/namn/alias låter en nyckel
// skugga en annan i matchExercise, och då kan AI:ns id mappas till FEL övning.

const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

describe('exercise catalog integrity', () => {
  it('is non-empty', () => {
    expect(EXERCISE_CATALOG.length).toBeGreaterThan(50)
  })

  it('has unique ids', () => {
    const ids = EXERCISE_CATALOG.map((e) => e.id)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  it('has unique names', () => {
    const names = EXERCISE_CATALOG.map((e) => e.name)
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([])
  })

  // Ett alias som återanvänds (eller krockar med ett id/namn efter
  // normalisering) gör matchningen beroende av ordningen i filen.
  it('has no lookup key (id, name or alias) used by two exercises', () => {
    const owner = new Map<string, string>()
    const collisions: string[] = []
    for (const e of EXERCISE_CATALOG) {
      for (const key of [e.id, e.name, ...e.aliases]) {
        const n = normalize(key)
        const existing = owner.get(n)
        if (existing != null && existing !== e.id) {
          collisions.push(`"${key}" delas av ${existing} och ${e.id}`)
        }
        owner.set(n, e.id)
      }
    }
    expect(collisions).toEqual([])
  })

  it('resolves every id back to itself through getExerciseById and matchExercise', () => {
    const broken: string[] = []
    for (const e of EXERCISE_CATALOG) {
      if (getExerciseById(e.id)?.id !== e.id) broken.push(`getExerciseById(${e.id})`)
      if (matchExercise(e.id)?.id !== e.id) broken.push(`matchExercise(${e.id})`)
      if (matchExercise(e.name)?.id !== e.id) broken.push(`matchExercise(${e.name})`)
    }
    expect(broken).toEqual([])
  })

  it('resolves every alias to its own exercise', () => {
    const broken: string[] = []
    for (const e of EXERCISE_CATALOG) {
      for (const alias of e.aliases) {
        if (matchExercise(alias)?.id !== e.id) broken.push(`${alias} → ${e.id}`)
      }
    }
    expect(broken).toEqual([])
  })
})

/**
 * Utrustningsfiltret. Buggen det rättar: prompten bad modellen välja övningar
 * som matchade användarens utrustning, men katalogen den fick innehöll varken
 * utrustningen eller samma språk som profilen — så den kunde inte följa
 * instruktionen, och föreslog skivstångsövningar till den som bara har hantlar.
 */
describe('allowedEquipment', () => {
  it('hantlar ger hantelövningar och kroppsvikt, inget annat', () => {
    const allowed = allowedEquipment(['Hantlar'])
    expect([...allowed].sort()).toEqual(['body only', 'dumbbell'])
  })

  it('skivstång tar med EZ-stången', () => {
    const allowed = allowedEquipment(['Skivstång'])
    expect(allowed.has('barbell')).toBe(true)
    expect(allowed.has('e-z curl bar')).toBe(true)
    expect(allowed.has('machine')).toBe(false)
  })

  it('fullt gym ger allt katalogen har', () => {
    const allowed = allowedEquipment(['Gym (fullutrustat)'])
    for (const ex of EXERCISE_CATALOG) {
      expect(allowed.has(ex.equipment), `${ex.id} (${ex.equipment})`).toBe(true)
    }
  })

  it('kroppsvikt är alltid tillåtet', () => {
    for (const choice of ['Hantlar', 'Skivstång', 'Kettlebells', 'Gummiband']) {
      expect(allowedEquipment([choice]).has('body only'), choice).toBe(true)
    }
  })

  // Gummiband finns inte i katalogen. Den användaren ska få
  // kroppsviktsövningar, inte kabelmaskiner.
  it('gummiband ger bara kroppsvikt', () => {
    expect([...allowedEquipment(['Gummiband'])]).toEqual(['body only'])
  })

  it('tom profil filtrerar inte', () => {
    const allowed = allowedEquipment([])
    for (const ex of EXERCISE_CATALOG) expect(allowed.has(ex.equipment)).toBe(true)
  })

  /**
   * Det viktigaste testet här. Ett värde kartan inte känner måste ge ALLT,
   * inte bara kroppsvikt — annars reduceras en användare med ett äldre eller
   * felstavat värde tyst till armhävningar. Testfixturen i ai.test.ts hade
   * 'bodyweight' och mockdatan 'Gym', båda utanför onboardingens val.
   */
  it('okänt värde filtrerar inte alls', () => {
    const allowed = allowedEquipment(['Något vi aldrig sett'])
    for (const ex of EXERCISE_CATALOG) expect(allowed.has(ex.equipment)).toBe(true)
  })

  it('ett okänt värde bland kända slår av filtret helt', () => {
    const allowed = allowedEquipment(['Hantlar', 'Rysk kettlebell deluxe'])
    expect(allowed.has('barbell')).toBe(true)
  })

  it('känner igen alias ur äldre data', () => {
    expect([...allowedEquipment(['bodyweight'])]).toEqual(['body only'])
    expect(allowedEquipment(['Gym']).has('machine')).toBe(true)
  })

  it('bryr sig inte om mellanslag', () => {
    expect([...allowedEquipment([' Hantlar '])].sort()).toEqual(['body only', 'dumbbell'])
  })
})

describe('catalogForPrompt', () => {
  it('visar utrustningen per övning', () => {
    // Utan den kunde modellen inte veta vad någon övning krävde.
    expect(catalogForPrompt()).toMatch(/\(Bänkpress, barbell\)/)
  })

  it('utesluter övningar utanför filtret', () => {
    const text = catalogForPrompt(allowedEquipment(['Hantlar']))
    expect(text).not.toMatch(/barbell/)
    expect(text).toMatch(/dumbbell/)
  })

  it('lämnar aldrig en tom katalog', () => {
    expect(catalogForPrompt(allowedEquipment(['Gummiband'])).trim().length).toBeGreaterThan(0)
  })
})

describe('isExerciseAllowed', () => {
  it('nekar en övning utanför utrustningen', () => {
    const allowed = allowedEquipment(['Hantlar'])
    expect(isExerciseAllowed('bankpress', allowed)).toBe(false)
  })

  it('okänt id är aldrig tillåtet', () => {
    expect(isExerciseAllowed('finns-inte', allowedEquipment([]))).toBe(false)
  })
})
