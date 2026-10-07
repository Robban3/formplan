import { describe, it, expect } from 'vitest'
import {
  parseIngredient,
  mergeIngredients,
  ingredientKey,
  formatIngredientAmount,
} from './recipeIngredients'

/**
 * Tolkningen av receptens ingrediensrader.
 *
 * Det här är den enda delen av inköpslistan som arbetar med fritext från en
 * språkmodell, och därmed den enda som kan ha fel utan att krascha. Testerna
 * är därför skrivna mot formuleringar som FAKTISKT förekommer i svenska
 * recept, inte bara mot den form parsern råkar vara byggd för.
 */

/** Kortform: mängd + familj, för läsbara förväntningar. */
const p = (raw: string) => {
  const r = parseIngredient(raw)
  return { name: r.name, amount: r.amount, family: r.family }
}

describe('mängd och enhet', () => {
  it('gram', () => {
    expect(p('150 g kycklingfilé')).toEqual({ name: 'kycklingfilé', amount: 150, family: 'mass' })
  })

  it('kilo räknas om till gram', () => {
    expect(p('1 kg potatis')).toEqual({ name: 'potatis', amount: 1000, family: 'mass' })
  })

  it('deciliter räknas om till milliliter', () => {
    expect(p('2 dl havregryn')).toEqual({ name: 'havregryn', amount: 200, family: 'volume' })
  })

  // 1 msk = 15 ml och 1 tsk = 5 ml är definitioner, inte uppskattningar.
  it('matsked och tesked', () => {
    expect(p('1 msk olivolja')).toEqual({ name: 'olivolja', amount: 15, family: 'volume' })
    expect(p('2 tsk salt')).toEqual({ name: 'salt', amount: 10, family: 'volume' })
    expect(p('1 krm kanel')).toEqual({ name: 'kanel', amount: 1, family: 'volume' })
  })

  it('utskrivna enheter', () => {
    expect(p('2 matskedar soja').amount).toBe(30)
    expect(p('3 deciliter mjölk').amount).toBe(300)
  })

  // Ett tal utan enhet är ett antal — "2 ägg" är två ägg, inte 2 gram.
  it('tal utan enhet blir antal', () => {
    expect(p('2 ägg')).toEqual({ name: 'ägg', amount: 2, family: 'count' })
  })

  it('uttrycklig styck-enhet', () => {
    expect(p('2 st ägg')).toEqual({ name: 'ägg', amount: 2, family: 'count' })
  })

  it('punkt efter enheten', () => {
    expect(p('2 msk. olivolja').amount).toBe(30)
  })
})

describe('tal i olika former', () => {
  it('decimal med komma och punkt', () => {
    expect(p('1,5 dl grädde').amount).toBe(150)
    expect(p('1.5 dl grädde').amount).toBe(150)
  })

  it('bråk med snedstreck', () => {
    expect(p('1/2 gul lök')).toEqual({ name: 'gul lök', amount: 0.5, family: 'count' })
  })

  it('typografiskt bråk', () => {
    expect(p('½ dl vatten').amount).toBe(50)
  })

  it('blandat tal', () => {
    expect(p('1 1/2 dl mjölk').amount).toBe(150)
    expect(p('1½ dl mjölk').amount).toBe(150)
  })

  it('svenska räkneord', () => {
    expect(p('två ägg')).toEqual({ name: 'ägg', amount: 2, family: 'count' })
    expect(p('en gul lök').amount).toBe(1)
  })

  /**
   * Räkneord som SLUTAR på å, ä eller ö.
   *
   * JavaScripts `\b` bygger på [A-Za-z0-9_], så de bokstäverna är inte
   * ordtecken — `två\b` matchade aldrig, eftersom det inte finns någon gräns
   * mellan `å` och mellanslaget. `en` och `tre` fungerade, vilket gjorde felet
   * lätt att missa.
   */
  it('räkneord med å/ä/ö fungerar', () => {
    expect(p('två ägg').amount).toBe(2)
    expect(p('åtta ägg').amount).toBe(8)
    expect(p('två dl mjölk').amount).toBe(200)
  })

  it('ungefärsord stryks', () => {
    expect(p('ca 150 g kyckling')).toEqual({ name: 'kyckling', amount: 150, family: 'mass' })
    expect(p('cirka 2 dl mjölk').amount).toBe(200)
    expect(p('drygt 100 g smör').amount).toBe(100)
  })

  /**
   * Intervall ger det ÖVRE talet. Handlar man för lite måste man gå tillbaka;
   * handlar man för mycket blir det över. Det senare är billigare.
   */
  it('intervall tar det övre talet', () => {
    expect(p('2-3 msk soja').amount).toBe(45)
    expect(p('2–3 msk soja').amount).toBe(45)
    expect(p('1 till 2 dl vatten').amount).toBe(200)
  })
})

describe('det som inte går att tolka behålls ord för ord', () => {
  /**
   * Regel 2: en rad utan mängd får ALDRIG försvinna. Att tyst släppa den är
   * värst av allt — det upptäcks först i affären.
   */
  it('ingen mängd alls', () => {
    expect(p('salt och peppar')).toEqual({ name: 'salt och peppar', amount: null, family: null })
  })

  it('obestämd mängd får ingen påhittad siffra', () => {
    for (const raw of ['en näve spenat', 'en nypa salt', 'en skvätt grädde', 'ett knippe dill']) {
      expect(p(raw), raw).toEqual({ name: raw, amount: null, family: null })
    }
  })

  it('tom rad kraschar inte', () => {
    expect(p('')).toEqual({ name: '', amount: null, family: null })
    expect(p('   ')).toEqual({ name: '', amount: null, family: null })
  })

  // En siffra utan livsmedel är inget att handla.
  it('bara ett tal ger ingen post', () => {
    expect(p('2').amount).toBe(null)
  })

  it('nolldivision kraschar inte', () => {
    expect(p('1/0 lök').amount).toBe(null)
  })
})

describe('vikt i parentes vinner över förpackning', () => {
  /**
   * "1 burk kokta kikärter (400 g)" — "burk" går inte att summera, men
   * grammet gör det, och det är det man handlar efter.
   */
  it('burk med gramvikt', () => {
    const r = parseIngredient('1 burk kokta kikärter (400 g)')
    expect(r.amount).toBe(400)
    expect(r.family).toBe('mass')
    expect(r.name).toContain('kikärter')
  })

  it('paket med vikt', () => {
    expect(parseIngredient('1 paket tofu (270 g)').amount).toBe(270)
  })

  // Ett ANTAL i parentes är ingen vikt och ska inte vinna.
  it('antal i parentes vinner inte', () => {
    expect(parseIngredient('2 lökar (medelstora)').amount).toBe(2)
  })
})

describe('ingredientKey', () => {
  /**
   * Bearbetningsord stryks: "hackad lök" och "lök" är samma vara i affären.
   * Ord som ändrar PRODUKTEN gör det inte — se nästa test.
   */
  it('stryker bearbetningsord', () => {
    expect(ingredientKey('finhackad lök')).toBe('lök')
    expect(ingredientKey('lök, finhackad')).toBe('lök')
    expect(ingredientKey('riven parmesan')).toBe('parmesan')
  })

  /**
   * Det här är gränsen som gör funktionen trygg. Torkad tomat är inte färsk
   * tomat, och rökt lax är inte lax — slogs de ihop hade listan sagt åt dig
   * att köpa fel vara.
   */
  it('stryker INTE ord som ändrar varan', () => {
    expect(ingredientKey('torkade tomater')).toBe('torkade tomater')
    expect(ingredientKey('fryst spenat')).toBe('fryst spenat')
    expect(ingredientKey('rökt lax')).toBe('rökt lax')
    expect(ingredientKey('kokta kikärter')).toBe('kokta kikärter')
  })

  it('skiftläge och skiljetecken spelar ingen roll', () => {
    expect(ingredientKey('Kycklingfilé,')).toBe(ingredientKey('kycklingfilé'))
  })
})

describe('mergeIngredients', () => {
  it('summerar samma livsmedel i samma enhet', () => {
    const merged = mergeIngredients(
      ['150 g kyckling', '200 g kyckling'].map(parseIngredient)
    )
    expect(merged).toHaveLength(1)
    expect(merged[0]!.amount).toBe(350)
  })

  it('summerar över enheter inom samma familj', () => {
    const merged = mergeIngredients(['1 msk olivolja', '2 tsk olivolja'].map(parseIngredient))
    expect(merged).toHaveLength(1)
    expect(merged[0]!.amount).toBe(25) // 15 + 10 ml
  })

  it('slår ihop trots bearbetningsord', () => {
    const merged = mergeIngredients(['1 gul lök', '1 hackad gul lök'].map(parseIngredient))
    expect(merged).toHaveLength(1)
    expect(merged[0]!.amount).toBe(2)
  })

  /**
   * Regel 1: massa och volym slås ALDRIG ihop. Att göra det kräver en
   * densitet, och den skiljer sig mellan olja, mjöl och socker. Två rader är
   * ärligare än ett tal som ser exakt ut men är fel.
   */
  it('slår inte ihop massa och volym', () => {
    const merged = mergeIngredients(['2 dl mjölk', '100 g mjölk'].map(parseIngredient))
    expect(merged).toHaveLength(2)
  })

  it('otolkade rader slås aldrig ihop', () => {
    const merged = mergeIngredients(
      ['salt och peppar', 'salt och peppar'].map(parseIngredient)
    )
    expect(merged).toHaveLength(2)
    expect(merged.every((m) => m.amount === null)).toBe(true)
  })

  it('behåller källraderna', () => {
    const merged = mergeIngredients(['150 g kyckling', '200 g kyckling'].map(parseIngredient))
    expect(merged[0]!.sources).toEqual(['150 g kyckling', '200 g kyckling'])
  })

  // Otolkade hamnar sist, så listan börjar med det som går att handla på mängd.
  it('otolkade ligger efter de tolkade', () => {
    const merged = mergeIngredients(['salt', '150 g kyckling'].map(parseIngredient))
    expect(merged[0]!.amount).toBe(150)
    expect(merged[1]!.amount).toBe(null)
  })
})

describe('formatIngredientAmount', () => {
  it('massa', () => {
    expect(formatIngredientAmount(350, 'mass')).toBe('350 g')
    expect(formatIngredientAmount(1500, 'mass')).toBe('1,5 kg')
  })

  // Ett recept säger "3 dl", inte "300 ml".
  it('volym i den största jämna enheten', () => {
    expect(formatIngredientAmount(300, 'volume')).toBe('3 dl')
    expect(formatIngredientAmount(45, 'volume')).toBe('3 msk')
    expect(formatIngredientAmount(10, 'volume')).toBe('2 tsk')
    expect(formatIngredientAmount(7, 'volume')).toBe('7 ml')
    expect(formatIngredientAmount(2000, 'volume')).toBe('2 l')
  })

  it('antal', () => {
    expect(formatIngredientAmount(2, 'count')).toBe('2 st')
    expect(formatIngredientAmount(0.5, 'count')).toBe('0,5 st')
  })

  it('utan mängd blir tom sträng', () => {
    expect(formatIngredientAmount(null, null)).toBe('')
  })
})

/**
 * Ett helt recept rakt igenom — den form AI:n faktiskt svarar med.
 */
describe('ett verkligt recept', () => {
  const RECIPE = [
    '150 g kycklingfilé',
    '1 msk olivolja',
    '2 dl kokt ris',
    '1/2 gul lök, finhackad',
    '1 vitlöksklyfta',
    'ca 100 g broccoli',
    'salt och peppar',
    'en näve färsk persilja',
  ]

  it('varje rad ger en post, ingen försvinner', () => {
    const merged = mergeIngredients(RECIPE.map(parseIngredient))
    expect(merged).toHaveLength(RECIPE.length)
  })

  it('de med mängd tolkas rätt', () => {
    const byName = Object.fromEntries(
      mergeIngredients(RECIPE.map(parseIngredient)).map((m) => [m.name, m])
    )
    expect(byName['kycklingfilé']!.amount).toBe(150)
    expect(byName['olivolja']!.amount).toBe(15)
    expect(byName['kokt ris']!.amount).toBe(200)
    expect(byName['broccoli']!.amount).toBe(100)
  })

  it('de utan mängd står kvar ordagrant', () => {
    const merged = mergeIngredients(RECIPE.map(parseIngredient))
    const raws = merged.filter((m) => m.amount === null).map((m) => m.name)
    expect(raws).toContain('salt och peppar')
    expect(raws).toContain('en näve färsk persilja')
  })
})
