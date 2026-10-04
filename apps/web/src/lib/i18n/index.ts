/**
 * Översättning.
 *
 * Egen modul i stället för ett i18n-bibliotek: appen behöver två språk, platt
 * uppslagning och interpolation, och inget mer. react-i18next hade lagt till
 * ~40 kB och en laddningsfas för det.
 *
 * Strängarna ligger i sv.ts (nyckelkällan) och en.ts (typad mot den).
 */

import { sv, type TextKey } from './sv'
import { en } from './en'

export type { TextKey }
export type Lang = 'sv' | 'en'

/** 'auto' följer telefonens språk. Sparas i inställningarna. */
export type LanguageSetting = 'auto' | Lang

export const LANGUAGES: Lang[] = ['sv', 'en']

const DICTS: Record<Lang, Record<TextKey, string>> = { sv, en }

/**
 * Vilket språk som gäller.
 *
 * Vid 'auto' vinner första språket i listan som appen kan — så en telefon satt
 * till svenska med engelska som andraval får svenska, och en telefon satt till
 * tyska får engelska (inte svenska: en tysktalande läser hellre engelska än ett
 * språk hen inte valt).
 */
export function resolveLang(
  setting: LanguageSetting,
  preferred: readonly string[] = []
): Lang {
  if (setting !== 'auto') return setting
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0]
    if (base === 'sv') return 'sv'
    if (base === 'en') return 'en'
  }
  return 'en'
}

/** Språken enheten ber om, i prioritetsordning. */
export function deviceLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  const list = navigator.languages
  if (Array.isArray(list) && list.length > 0) return list
  return navigator.language ? [navigator.language] : []
}

/**
 * Slår upp en text. Saknas nyckeln i det valda språket faller den tillbaka på
 * svenska i stället för att visa nyckeln — typningen ska redan ha fångat det,
 * men en trasig produktionsbygge ska inte visa "goals.status.weekly".
 */
export function translate(
  lang: Lang,
  key: TextKey,
  vars?: Record<string, string | number>
): string {
  const template = DICTS[lang]?.[key] ?? sv[key] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole
  )
}

/**
 * BCP 47-tagg för Intl — datum, tider och tusentalsavgränsare.
 *
 * Engelska får en-GB, inte en-US: appen säljs i Sverige, och dag-före-månad
 * (4 October) plus 24-timmarsklocka ligger närmare hur användarna redan läser
 * datum. en-US hade gett "October 4" och "2:30 PM" i en app vars tider i
 * övrigt står som 14:30.
 */
export function localeFor(lang: Lang): string {
  return lang === 'sv' ? 'sv-SE' : 'en-GB'
}

/**
 * Veckodagsnamn, måndag först.
 *
 * Hämtas ur Intl i stället för ordlistan: fjorton extra nycklar att hålla i
 * synk för något webbläsaren redan kan, och Intl får dessutom böjning och
 * förkortningar rätt per språk.
 *
 * Måndag först är avsiktligt — appens scheman numrerar weekday 1–7 från
 * måndag, som ISO-8601 och svensk kalender. 2024-01-01 var en måndag, så den
 * veckan ger rätt ordning.
 */
export function weekdayNames(locale: string, style: 'long' | 'short' | 'narrow' = 'long'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: style })
  return Array.from({ length: 7 }, (_, i) =>
    capitalizeFirst(fmt.format(new Date(Date.UTC(2024, 0, 1 + i))))
  )
}

/**
 * Stor begynnelsebokstav.
 *
 * Svensk ortografi skriver veckodagar med liten bokstav, och det är vad Intl
 * ger ("måndag"). Som fristående etikett i ett gränssnitt skrivs de ändå med
 * versal, och så har appen alltid visat dem — bara språket ska ändras här,
 * inte utseendet.
 */
export function capitalizeFirst(s: string): string {
  return s.length === 0 ? s : s[0]!.toLocaleUpperCase() + s.slice(1)
}

/** Funktionen skärmarna använder. */
export type TranslateFn = (key: TextKey, vars?: Record<string, string | number>) => string

export function translatorFor(lang: Lang): TranslateFn {
  return (key, vars) => translate(lang, key, vars)
}
