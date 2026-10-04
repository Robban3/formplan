import { describe, it, expect } from 'vitest'
import { resolveLang, translate, translatorFor, LANGUAGES } from './index'
import { sv } from './sv'
import { en } from './en'

describe('resolveLang', () => {
  it('ett uttryckligt val vinner över telefonen', () => {
    expect(resolveLang('sv', ['en-US'])).toBe('sv')
    expect(resolveLang('en', ['sv-SE'])).toBe('en')
  })

  it('auto följer telefonens språk', () => {
    expect(resolveLang('auto', ['sv-SE'])).toBe('sv')
    expect(resolveLang('auto', ['en-GB'])).toBe('en')
  })

  // Listan är i prioritetsordning — första språket appen kan vinner.
  it('auto respekterar ordningen i listan', () => {
    expect(resolveLang('auto', ['en-US', 'sv-SE'])).toBe('en')
    expect(resolveLang('auto', ['sv-SE', 'en-US'])).toBe('sv')
  })

  // En tysktalande läser hellre engelska än svenska, ett språk hen inte valt.
  it('faller till engelska för språk appen inte har', () => {
    expect(resolveLang('auto', ['de-DE', 'fr-FR'])).toBe('en')
    expect(resolveLang('auto', [])).toBe('en')
  })

  it('bryr sig inte om versaler eller region', () => {
    expect(resolveLang('auto', ['SV'])).toBe('sv')
    expect(resolveLang('auto', ['sv-FI'])).toBe('sv')
  })
})

describe('translate', () => {
  it('slår upp texten', () => {
    expect(translate('sv', 'meal.frukost')).toBe('Frukost')
    expect(translate('en', 'meal.frukost')).toBe('Breakfast')
  })

  it('fyller platshållare', () => {
    expect(translate('sv', 'goals.status.weekly', { done: 2, target: 4 }))
      .toBe('2 av 4 pass denna vecka')
    expect(translate('en', 'goals.status.weekly', { done: 2, target: 4 }))
      .toBe('2 of 4 workouts this week')
  })

  // En saknad variabel får inte bli "undefined" i gränssnittet.
  it('lämnar en platshållare utan värde orörd', () => {
    expect(translate('sv', 'goals.status.weekly', { done: 2 })).toContain('{target}')
  })

  it('translatorFor binder språket', () => {
    expect(translatorFor('en')('common.error')).toBe('Something went wrong')
  })
})

describe('ordlistorna', () => {
  it('täcker samma nycklar', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(sv).sort())
  })

  it('har ingen tom text', () => {
    for (const lang of LANGUAGES) {
      for (const key of Object.keys(sv) as (keyof typeof sv)[]) {
        expect(translate(lang, key).trim(), `${lang}:${key}`).not.toBe('')
      }
    }
  })

  /**
   * Det test som fångar den dyra sortens fel: en översättning som tappat
   * {target} ger en text som ser korrekt ut men saknar siffran. Typningen
   * märker det inte — den kontrollerar nycklar, inte innehåll.
   */
  it('behåller samma platshållare i båda språken', () => {
    const vars = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort()
    for (const key of Object.keys(sv) as (keyof typeof sv)[]) {
      expect(vars(en[key]), `${key}`).toEqual(vars(sv[key]))
    }
  })

  // Förslagen tolkas tillbaka av goalTracker och måste innehålla ett tal.
  it('målförslagen innehåller en siffra på båda språken', () => {
    const suggestionKeys = (Object.keys(sv) as (keyof typeof sv)[])
      .filter((k) => k.startsWith('goals.suggest.'))
    expect(suggestionKeys.length).toBeGreaterThan(0)
    for (const key of suggestionKeys) {
      for (const lang of LANGUAGES) {
        expect(translate(lang, key), `${lang}:${key}`).toMatch(/\d/)
      }
    }
  })
})
