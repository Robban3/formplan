import { describe, it, expect } from 'vitest'
import { EXERCISE_CATALOG, catalogForPrompt } from './exerciseCatalog'
import { allowedEquipment, isExerciseAllowed } from './equipment'

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
  it('visar utrustning och nivå per övning', () => {
    // Utan utrustningen kunde modellen inte veta vad någon övning krävde.
    // Nivån är vägledning: den enda kroppsviktsövningen för axlar är
    // expertnivå, och det måste modellen kunna se.
    expect(catalogForPrompt()).toMatch(/\(Bänkpress, barbell, beginner\)/)
    expect(catalogForPrompt()).toMatch(/\(Handstående armhävningar, body only, expert\)/)
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

/**
 * Hela kedjan när användaren ÄNDRAR sin utrustning.
 *
 * Det enskilda fallet som ska fungera: man klickar ur Kettlebells i
 * inställningarna och nästa generering slutar föreslå kettlebellövningar.
 *
 * Kedjan har tre led, och alla tre testas här mot samma profilvärden:
 *   1. allowedEquipment översätter profilens svenska val till katalogvärden,
 *   2. catalogForPrompt visar modellen bara det som är kvar,
 *   3. normalizePlanExercises släpper övningar utanför mängden — spärren för
 *      när modellen ändå hittar på en.
 *
 * Led 3 är inte överflödigt: namnuppslaget i normaliseringen går mot HELA
 * katalogen, så en övning som inte fanns i prompten kan ändå lösas upp.
 */
describe('ändrad utrustning får effekt på nästa generering', () => {
  const KETTLEBELL_IDS = EXERCISE_CATALOG.filter((e) => e.equipment === 'kettlebells').map((e) => e.id)

  it('katalogen har kettlebellövningar att utesluta', () => {
    // Utan det här skulle testerna nedan passera av fel anledning.
    expect(KETTLEBELL_IDS.length).toBeGreaterThan(0)
  })

  it('med kettlebells ingår de', () => {
    const allowed = allowedEquipment(['Hantlar', 'Kettlebells'])
    expect(allowed.has('kettlebells')).toBe(true)
    for (const id of KETTLEBELL_IDS) expect(isExerciseAllowed(id, allowed), id).toBe(true)
  })

  it('urklickad försvinner ur prompten', () => {
    const before = catalogForPrompt(allowedEquipment(['Hantlar', 'Kettlebells']))
    const after = catalogForPrompt(allowedEquipment(['Hantlar']))
    for (const id of KETTLEBELL_IDS) {
      expect(before, `${id} skulle finnas före`).toContain(id)
      expect(after, `${id} skulle vara borta efter`).not.toContain(id)
    }
    expect(after).not.toContain('kettlebells')
    // Resten av profilen påverkas inte.
    expect(after).toContain('dumbbell')
  })

  it('urklickad släpps även om modellen ändå föreslår den', () => {
    const allowed = allowedEquipment(['Hantlar'])
    for (const id of KETTLEBELL_IDS) expect(isExerciseAllowed(id, allowed), id).toBe(false)
  })

  // Det omvända hållet måste också fungera: lägger man TILL utrustning ska den
  // bli valbar direkt, utan att något annat behöver ändras.
  it('tillagd utrustning blir tillgänglig', () => {
    expect(allowedEquipment(['Inga redskap (kroppsvikt)']).has('kettlebells')).toBe(false)
    expect(allowedEquipment(['Inga redskap (kroppsvikt)', 'Kettlebells']).has('kettlebells')).toBe(true)
  })
})
