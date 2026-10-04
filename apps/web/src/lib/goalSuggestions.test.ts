import { describe, it, expect } from 'vitest'
import { goalSuggestions } from './goalSuggestions'
import { translatorFor } from './i18n'
import { parseGoal } from './goalTracker'

const sv = translatorFor('sv')
const en = translatorFor('en')

describe('goalSuggestions', () => {
  it('följer språket', () => {
    expect(goalSuggestions(sv, false).map((s) => s.text)).toContain('Gå ner 5 kg')
    expect(goalSuggestions(en, false).map((s) => s.text)).toContain('Lose 5 kg')
  })

  it('följer enheten', () => {
    expect(goalSuggestions(en, true).map((s) => s.text)).toContain('Lose 10 lbs')
    expect(goalSuggestions(en, true).map((s) => s.text)).not.toContain('Lose 5 kg')
    expect(goalSuggestions(sv, true).map((s) => s.text)).toContain('Gå ner 10 lbs')
  })

  it('ger samma antal förslag i alla kombinationer', () => {
    const counts = [
      goalSuggestions(sv, false).length,
      goalSuggestions(sv, true).length,
      goalSuggestions(en, false).length,
      goalSuggestions(en, true).length,
    ]
    expect(new Set(counts).size).toBe(1)
    expect(counts[0]).toBe(9)
  })

  /**
   * Målsidan filtrerade tidigare på `hint.includes('Auto')`. Det fungerade på
   * svenska men hade tömt listan på engelska, där hinten är "Tracked
   * automatically" med litet a. Flaggan är därför ett eget fält.
   */
  it('markerar spårbara mål med ett fält, inte med hint-texten', () => {
    for (const t of [sv, en]) {
      const auto = goalSuggestions(t, false).filter((s) => s.auto)
      expect(auto.length).toBe(7)
      expect(auto.every((s) => s.hint === t('goals.trackingAutomatic'))).toBe(true)
    }
  })

  /**
   * Det viktigaste testet här: ett förslag som appen inte kan tolka tillbaka
   * blir ett mål utan framsteg. Varje förslag märkt `auto` måste gå igenom
   * parseGoal på BÅDA språken och i BÅDA enhetssystemen.
   */
  it('alla automatiska förslag kan tolkas tillbaka', () => {
    for (const t of [sv, en]) {
      for (const imperial of [false, true]) {
        for (const s of goalSuggestions(t, imperial).filter((x) => x.auto)) {
          const meta = parseGoal(s.text)
          expect(meta.type, `"${s.text}"`).not.toBe('manual')
          expect(meta.targetValue, `"${s.text}"`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('manuella förslag tolkas inte som spårbara', () => {
    for (const t of [sv, en]) {
      for (const s of goalSuggestions(t, false).filter((x) => !x.auto)) {
        expect(parseGoal(s.text).type, `"${s.text}"`).toBe('manual')
      }
    }
  })
})
