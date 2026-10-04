/**
 * Språket AI:n ska svara på.
 *
 * Appen är tvåspråkig, men prompten var hårdkodad till svenska:
 * "Use Swedish food and meal names where appropriate (this is a Swedish
 * product)". En engelsk användare fick därför ett engelskt gränssnitt med
 * svenska måltider och en coach som svarade på svenska.
 *
 * Språket kommer från appens EGNA inställning, inte från Accept-Language.
 * I en Capacitor-WebView speglar Accept-Language telefonens språk, inte det
 * användaren valt under Inställningar → Språk, och de kan skilja sig.
 */

export type Lang = 'sv' | 'en'

export const LANG_HEADER = 'x-formplan-language'

/**
 * Läser språket ur headern. Allt okänt — saknad header, gammal klient, skräp
 * — blir svenska, så beteendet är oförändrat för alla som inte skickar den.
 */
export function langFromHeader(value: string | undefined | null): Lang {
  return value?.trim().toLowerCase() === 'en' ? 'en' : 'sv'
}

/**
 * Raden som läggs i systemprompten.
 *
 * Övningsnamnen är undantagna med avsikt: de kommer ur katalogen och används
 * som matchningsnyckel mot bilder, teknikbeskrivningar och historik. Ett
 * översatt namn skulle inte gå att slå upp. Katalogen behöver en egen
 * etikettkolumn innan de kan visas på engelska.
 */
export function languageInstruction(lang: Lang): string {
  return lang === 'en'
    ? 'Write all free text — meal names, food names, notes, titles and descriptions — in ENGLISH. Exercise names are the exception: use the exact Swedish name from the catalog, because it is the lookup key for images and technique.'
    : 'Skriv all fri text — måltidsnamn, livsmedel, noteringar, titlar och beskrivningar — på SVENSKA.'
}

/** Språknamnet i klartext, för prompter som behöver formulera det själva. */
export function languageName(lang: Lang): string {
  return lang === 'en' ? 'English' : 'Swedish'
}
