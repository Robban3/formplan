import { describe, it, expect } from 'vitest'
import {
  toDisplayWeight,
  toStoreWeight,
  formatWeight,
  toDisplayVolume,
  toStoreVolume,
  formatVolume,
  toDisplayFoodMass,
  toStoreFoodMass,
  formatFoodMass,
  toDisplayLength,
  toStoreLength,
  formatHeight,
  formatDistance,
  toStoreDistance,
  toDisplayDistance,
  weightLabel,
  volumeLabel,
  foodMassLabel,
  lengthLabel,
} from './units'

describe('etiketter', () => {
  it('följer inställningen', () => {
    expect(weightLabel(false)).toBe('kg')
    expect(weightLabel(true)).toBe('lbs')
    expect(volumeLabel(false)).toBe('ml')
    expect(volumeLabel(true)).toBe('fl oz')
    expect(foodMassLabel(false)).toBe('g')
    expect(foodMassLabel(true)).toBe('oz')
    expect(lengthLabel(false)).toBe('cm')
    expect(lengthLabel(true)).toBe('in')
  })
})

describe('vikt', () => {
  it('lämnar metriskt orört', () => {
    expect(toDisplayWeight(84, false)).toBe(84)
    expect(toStoreWeight(84, false)).toBe(84)
  })

  it('räknar om till pund', () => {
    expect(toDisplayWeight(100, true)).toBe(220.5)
    expect(formatWeight(100, true)).toBe('220,5 lbs')
  })

  // Buggen som fanns: toDisplay rundade BARA i imperial. En vikt inmatad som
  // 225 lbs lagras som 102,0582 kg, och i metriskt läge visades hela den
  // strängen — i "Förra: …" och förifyllt i inmatningsfältet.
  it('rundar även metriskt', () => {
    const stored = toStoreWeight(225, true)
    expect(stored).toBe(102.0583)
    expect(toDisplayWeight(stored, false)).toBe(102.1)
    expect(formatWeight(stored, false)).toBe('102,1 kg')
  })

  // Matar man in i pund ska samma pundvärde komma tillbaka, annars kryper
  // vikten vid varje visning.
  it('håller pundvärdet över en tur och retur', () => {
    for (const lbs of [45, 135, 225, 315, 405]) {
      expect(toDisplayWeight(toStoreWeight(lbs, true), true)).toBe(lbs)
    }
  })
})

describe('volym', () => {
  it('lämnar milliliter orört', () => {
    expect(toDisplayVolume(500, false)).toBe(500)
    expect(toStoreVolume(500, false)).toBe(500)
  })

  it('räknar om till fluid ounces', () => {
    expect(toDisplayVolume(500, true)).toBe(16.9)
    expect(formatVolume(500, true)).toBe('16,9 fl oz')
  })

  // Lagrade milliliter är heltal — en vattenlogg på 8,5 fl oz får inte bli
  // 251,37475 ml i databasen.
  it('lagrar hela milliliter', () => {
    expect(Number.isInteger(toStoreVolume(8.5, true))).toBe(true)
    expect(toStoreVolume(8.5, true)).toBe(251)
  })

  // "2500 ml" läser sämre än "2,5 L"; gränsen går vid en liter.
  it('växlar till liter över 1000 ml', () => {
    expect(formatVolume(900, false)).toBe('900 ml')
    expect(formatVolume(1000, false)).toBe('1 L')
    expect(formatVolume(2500, false)).toBe('2,5 L')
  })

  // Gränssnittet använder svenskt decimalkomma (formatKg/formatLiters gör det
  // redan); ActiveWorkouts formatWeight skrev punkt och stack ut.
  it('skriver decimaler med komma, och drar bort ett avslutande noll', () => {
    expect(formatVolume(2000, false)).toBe('2 L')
    expect(formatWeight(84, false)).toBe('84 kg')
    expect(formatWeight(84.5, false)).toBe('84,5 kg')
  })
})

describe('mat', () => {
  it('lämnar gram orört', () => {
    expect(toDisplayFoodMass(250, false)).toBe(250)
    expect(toStoreFoodMass(250, false)).toBe(250)
  })

  it('räknar om till ounces', () => {
    expect(toDisplayFoodMass(100, true)).toBe(3.5)
    expect(formatFoodMass(100, true)).toBe('3,5 oz')
  })

  it('håller ounce-värdet över en tur och retur', () => {
    for (const oz of [1, 3.5, 8, 16]) {
      expect(toDisplayFoodMass(toStoreFoodMass(oz, true), true)).toBe(oz)
    }
  })
})

describe('längd', () => {
  it('räknar om till tum', () => {
    expect(toDisplayLength(100, true)).toBe(39.4)
    expect(toStoreLength(39.4, true)).toBeCloseTo(100.076, 3)
  })

  // Ingen uppger sin längd som 71 tum.
  it('visar kroppslängd i fot och tum', () => {
    expect(formatHeight(180, true)).toBe(`5'11"`) // 70,87 tum → 71
    expect(formatHeight(180, false)).toBe('180 cm')
  })

  // 11,6 tum rundas till 12 och måste slå över — annars blir det 5'12".
  it('slår över 12 tum till nästa fot', () => {
    expect(formatHeight(182.8, true)).toBe(`6'0"`)
    expect(formatHeight(152.4, true)).toBe(`5'0"`)
  })
})

describe('distans', () => {
  it('räknar om till miles', () => {
    expect(formatDistance(10, false)).toBe('10 km')
    expect(formatDistance(10, true)).toBe('6,2 miles')
  })

  // Distansfältet i det aktiva passet lagrar kilometer. Utan omvandlingen
  // hamnade 3 miles som 3 km i loggen.
  it('vänder tillbaka till kilometer', () => {
    expect(toStoreDistance(5, false)).toBe(5)
    expect(toStoreDistance(3, true)).toBeCloseTo(4.828, 3)
    expect(toDisplayDistance(toStoreDistance(3, true), true)).toBe(3)
  })
})
