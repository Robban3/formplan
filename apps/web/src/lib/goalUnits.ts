/**
 * Enheter i måltexter.
 *
 * Mål skrivs som fri text ("Gå ner 5 kg", "Lose 10 lbs", "Drink 1 gallon a
 * day") och tolkas av goalTracker. Tolkaren jämför sedan mot lagrad data, som
 * alltid är metrisk — så allt som läses ur texten normaliseras hit.
 *
 * Faktorerna kommer från lib/units.ts, så det bara finns en definition av vad
 * ett pund är.
 */

import { KG_PER_LBS, ML_PER_FLOZ, ML_PER_GALLON, ML_PER_CUP } from './units'

/** Enhetsord → kilo. */
const WEIGHT_TO_KG: Record<string, number> = {
  kg: 1,
  kilo: 1,
  kilon: 1,
  kilos: 1,
  kilogram: 1,
  kilograms: 1,
  lb: KG_PER_LBS,
  lbs: KG_PER_LBS,
  pound: KG_PER_LBS,
  pounds: KG_PER_LBS,
  pund: KG_PER_LBS,
}

/** Enhetsord → milliliter. */
const VOLUME_TO_ML: Record<string, number> = {
  l: 1000,
  liter: 1000,
  litre: 1000,
  liters: 1000,
  litres: 1000,
  'fl oz': ML_PER_FLOZ,
  floz: ML_PER_FLOZ,
  oz: ML_PER_FLOZ,
  ounce: ML_PER_FLOZ,
  ounces: ML_PER_FLOZ,
  gallon: ML_PER_GALLON,
  gallons: ML_PER_GALLON,
  gal: ML_PER_GALLON,
  cup: ML_PER_CUP,
  cups: ML_PER_CUP,
}

/**
 * Enhetsorden som reguljärt uttryck, längsta först.
 *
 * Ordningen är inte kosmetisk: står `l` före `liter` matchar alternationen
 * bara "l" i "liter" och resten av strängen tolkas fel. Samma gäller `oz`
 * mot `ounces` och `gal` mot `gallons`.
 */
function alternation(words: string[]): string {
  return words
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/ /g, '\\s*'))
    .join('|')
}

export const WEIGHT_UNIT_PATTERN = alternation(Object.keys(WEIGHT_TO_KG))
export const VOLUME_UNIT_PATTERN = alternation(Object.keys(VOLUME_TO_ML))

/** Både "2,5" och "2.5" förekommer — svensk inmatning använder komma. */
export const NUMBER_PATTERN = '\\d+(?:[,.]\\d+)?'

export function parseNumber(raw: string | undefined): number {
  return parseFloat((raw ?? '').replace(',', '.'))
}

/** Vikt i texten → kilo. Okänt enhetsord ger null. */
export function weightToKg(value: number, unit: string | undefined): number | null {
  const factor = WEIGHT_TO_KG[normalizeUnit(unit)]
  return factor === undefined ? null : value * factor
}

/** Volym i texten → milliliter. */
export function volumeToMl(value: number, unit: string | undefined): number | null {
  const factor = VOLUME_TO_ML[normalizeUnit(unit)]
  return factor === undefined ? null : value * factor
}

/** "FL OZ", "fl  oz" och "floz" är samma enhet. */
function normalizeUnit(unit: string | undefined): string {
  if (!unit) return ''
  const squashed = unit.toLowerCase().replace(/\s+/g, '')
  return squashed === 'floz' ? 'fl oz' : squashed
}
