import { describe, it, expect } from 'vitest'
import { langFromHeader, languageInstruction, languageName, LANG_HEADER } from './lang'

describe('langFromHeader', () => {
  it('läser engelska', () => {
    expect(langFromHeader('en')).toBe('en')
    expect(langFromHeader('EN')).toBe('en')
    expect(langFromHeader(' en ')).toBe('en')
  })

  /**
   * Allt okänt blir svenska. Viktigt: klienter som inte skickar headern — en
   * app som inte uppdaterats, eller ett anrop från ett skript — ska bete sig
   * exakt som före ändringen.
   */
  it('faller på svenska för allt annat', () => {
    expect(langFromHeader('sv')).toBe('sv')
    expect(langFromHeader(undefined)).toBe('sv')
    expect(langFromHeader(null)).toBe('sv')
    expect(langFromHeader('')).toBe('sv')
    expect(langFromHeader('de')).toBe('sv')
    expect(langFromHeader('en-GB')).toBe('sv') // bara exakt 'en' räknas
  })

  it('headernamnet är gemener, som Hono läser det', () => {
    expect(LANG_HEADER).toBe(LANG_HEADER.toLowerCase())
  })
})

describe('languageInstruction', () => {
  it('ber om engelska på engelska', () => {
    const en = languageInstruction('en')
    expect(en).toMatch(/ENGLISH/)
    expect(en).not.toMatch(/SVENSKA/)
  })

  it('ber om svenska på svenska', () => {
    expect(languageInstruction('sv')).toMatch(/SVENSKA/)
  })

  /**
   * Det här är instruktionens viktigaste del: övningsnamnen kommer ur
   * katalogen och är matchningsnyckel mot bilder, teknik och historik. Skulle
   * modellen översätta dem går de inte att slå upp, och passet tappar både
   * bild och progression. Undantaget måste stå kvar i den engelska varianten.
   */
  it('undantar övningsnamnen när språket är engelska', () => {
    expect(languageInstruction('en')).toMatch(/Swedish name from the catalog/)
  })
})

describe('languageName', () => {
  it('ger språket i klartext', () => {
    expect(languageName('sv')).toBe('Swedish')
    expect(languageName('en')).toBe('English')
  })
})
