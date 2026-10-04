import { describe, it, expect, vi, beforeEach } from 'vitest'

// Butikerna läses av computeAutoProgress/goalStatusText; parseGoal rör dem
// inte, men modulen importerar dem.
vi.mock('./workoutSessionStore', () => ({ getLocalSessions: () => [] }))
vi.mock('./waterStore', () => ({ getLocalWater: () => ({ total_ml: 0 }) }))
vi.mock('./weightStore', () => ({ getWeightEntries: () => [] }))

const { parseGoal, goalStatusText } = await import('./goalTracker')
const { translatorFor } = await import('./i18n')

beforeEach(() => vi.clearAllMocks())

describe('parseGoal — svenska', () => {
  it('veckoträning', () => {
    expect(parseGoal('Träna 3 gånger i veckan')).toEqual({
      type: 'training_weekly', targetValue: 3, unit: 'pass/vecka',
    })
    expect(parseGoal('4 pass i veckan').type).toBe('training_weekly')
    expect(parseGoal('träna 5 ggr/vecka').targetValue).toBe(5)
  })

  it('vatten i liter', () => {
    expect(parseGoal('Dricka 2,5 liter vatten per dag')).toEqual({
      type: 'water_daily', targetValue: 2500, unit: 'ml/dag',
    })
    expect(parseGoal('2 L vatten om dagen').targetValue).toBe(2000)
  })

  it('målvikt och viktnedgång', () => {
    expect(parseGoal('Väga 75 kg')).toEqual({
      type: 'weight_target', targetValue: 75, unit: 'kg',
    })
    expect(parseGoal('Gå ner 5 kg')).toEqual({
      type: 'weight_loss', targetValue: 5, unit: 'kg',
    })
    expect(parseGoal('komma ner till 68 kg').type).toBe('weight_target')
  })

  it('totalt antal pass', () => {
    expect(parseGoal('Klara 50 pass totalt')).toEqual({
      type: 'training_total', targetValue: 50, unit: 'pass',
    })
  })

  it('allt annat blir manuellt', () => {
    expect(parseGoal('Klara 10 pull-ups i rad').type).toBe('manual')
    expect(parseGoal('Bli starkare').type).toBe('manual')
  })
})

// Appen är tvåspråkig. Känner tolkaren inte igen engelska formuleringar blir
// varje mål en engelsk användare skriver ospårbart, utan att något säger varför.
describe('parseGoal — engelska', () => {
  it('veckoträning', () => {
    expect(parseGoal('Train 3 times a week')).toEqual({
      type: 'training_weekly', targetValue: 3, unit: 'pass/vecka',
    })
    expect(parseGoal('work out 4 times per week').targetValue).toBe(4)
    expect(parseGoal('5 workouts a week').type).toBe('training_weekly')
  })

  it('vatten', () => {
    expect(parseGoal('Drink 2 liters of water a day').targetValue).toBe(2000)
  })

  it('vikt', () => {
    expect(parseGoal('Weigh 165 lbs').type).toBe('weight_target')
    expect(parseGoal('Lose 10 lbs').type).toBe('weight_loss')
    expect(parseGoal('drop 5 pounds').type).toBe('weight_loss')
    expect(parseGoal('get down to 70 kg').type).toBe('weight_target')
  })

  it('totalt antal pass', () => {
    expect(parseGoal('Complete 50 workouts total')).toEqual({
      type: 'training_total', targetValue: 50, unit: 'pass',
    })
  })
})

// Lagringen är metrisk. Skrivs målet i pund eller fl oz måste targetValue
// vändas, annars jämförs 165 lbs mot kilo och målet ser uppnått ut direkt.
describe('parseGoal — imperiala enheter normaliseras', () => {
  it('pund blir kilo', () => {
    expect(parseGoal('Lose 10 lbs').targetValue).toBeCloseTo(4.5, 1)
    expect(parseGoal('Weigh 165 lbs').targetValue).toBeCloseTo(74.8, 1)
    expect(parseGoal('Gå ner 10 pund').targetValue).toBeCloseTo(4.5, 1)
  })

  it('fluid ounces blir milliliter', () => {
    expect(parseGoal('Drink 100 fl oz of water a day').targetValue).toBe(2957)
    expect(parseGoal('Dricka 80 fl oz vatten per dag').targetValue).toBe(2366)
  })

  // "En gallon om dagen" är ett vanligt vattenmål.
  it('gallon blir milliliter', () => {
    expect(parseGoal('Drink 1 gallon a day')).toEqual({
      type: 'water_daily', targetValue: 3785, unit: 'ml/dag',
    })
  })

  it('cups blir milliliter', () => {
    expect(parseGoal('Drink 8 cups of water a day').targetValue).toBe(1893)
  })

  // Enhetsalternationen måste ha längsta ordet först. Står "l" före "liter"
  // matchas bara l:et i "lbs" och målet blir ett vattenmål på 10 liter.
  it('läser inte "10 lbs" som 10 liter', () => {
    expect(parseGoal('Lose 10 lbs').type).toBe('weight_loss')
    expect(parseGoal('Weigh 180 lb').type).toBe('weight_target')
  })

  // Gamla skyddet mot att "5 löppass" tolkas som liter måste hålla.
  it('tolkar inte ord som börjar på enhetsbokstaven', () => {
    expect(parseGoal('5 löppass i veckan').type).not.toBe('water_daily')
    expect(parseGoal('Springa 5 km utan paus').type).toBe('manual')
  })

  it('avvisar orimliga vattenmål', () => {
    expect(parseGoal('Dricka 50 liter per dag').type).not.toBe('water_daily')
  })
})

describe('goalStatusText', () => {
  const sv = { t: translatorFor('sv'), imperial: false, lang: 'sv' as const }
  const en = { t: translatorFor('en'), imperial: true, lang: 'en' as const }

  it('följer språket', () => {
    const meta = parseGoal('Träna 4 gånger i veckan')
    expect(goalStatusText(meta, sv)).toBe('0 av 4 pass denna vecka')
    expect(goalStatusText(meta, en)).toBe('0 of 4 workouts this week')
  })

  it('följer enheten', () => {
    const meta = parseGoal('Dricka 2,5 liter vatten per dag')
    expect(goalStatusText(meta, sv)).toBe('0 ml av 2,5 L idag')
    expect(goalStatusText(meta, en)).toBe('0 fl oz of 84.5 fl oz today')
  })

  it('ger inget för manuella mål', () => {
    expect(goalStatusText(parseGoal('Bli starkare'), sv)).toBeNull()
  })
})
