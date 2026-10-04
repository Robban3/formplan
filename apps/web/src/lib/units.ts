/**
 * Enhetsomvandling.
 *
 * Allt lagras ALLTID metriskt: vikter i kilo, vatten i milliliter, mat i gram,
 * kroppsmått och längd i centimeter. Imperial finns bara på vägen in och ut, så
 * databasen är fri från enhetsfrågan och ett byte av enhet aldrig rör
 * historiken.
 *
 * Logiken låg tidigare inline i useUnits, användes i en enda skärm (det aktiva
 * passet) och gick inte att testa utan att rendera en hook. Resten av appen
 * hade hårdkodade "kg", "ml" och "g", så växeln i inställningarna ändrade i
 * praktiken ingenting. Den ligger nu här som rena funktioner som alla skärmar
 * delar.
 */

import type { Lang } from './i18n'

// Exakta definitioner, inte avrundade faktorer. Med 2.20462 i stället för
// 1/0.45359237 hamnade 225 lbs på 102,0584 kg i stället för 102,0583 — litet,
// men det är gratis att ha rätt.

/** 1 pund i kilo (exakt per internationell definition). */
export const KG_PER_LBS = 0.45359237
/** 1 US fluid ounce i milliliter (exakt: 1/128 US gallon). */
export const ML_PER_FLOZ = 29.5735295625
/** 1 ounce i gram (exakt: 1/16 pund). */
export const G_PER_OZ = 28.349523125
/** 1 US gallon i milliliter (exakt: 231 kubiktum). "En gallon om dagen" är ett
 *  vanligt vattenmål, så tolkaren måste känna igen det. */
export const ML_PER_GALLON = 3785.411784
/** 1 US cup i milliliter (exakt: 1/16 gallon). */
export const ML_PER_CUP = 236.5882365
/** 1 tum i centimeter (exakt). */
export const CM_PER_INCH = 2.54
/** 1 mile i kilometer (exakt). */
export const KM_PER_MILE = 1.609344

/** Visade värden rundas till ett decimaltal. Skivor finns i steg om 0,5 kg. */
const DISPLAY_DECIMALS = 1

/**
 * Lagrade kilo rundas till fyra decimaler (0,1 gram). Nog för att en vikt som
 * matats in i pund ska gå tillbaka till samma pundvärde, utan att flyta.
 */
const STORE_DECIMALS = 4

/** Svenska är standard — det språk appen skrevs på. */
const DEFAULT_LANG: Lang = 'sv'

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Tal i text.
 *
 * Decimaltecknet följer SPRÅKET, inte enheten: svenska skriver "2,5", engelska
 * "2.5". Tidigare var kommat hårdkodat, vilket gav "84,5 fl oz today" i den
 * engelska appen.
 *
 * Ett avslutande ",0" tas bort så det står "100 kg" och inte "100,0 kg".
 *
 * Numeriska toDisplay*-funktioner lämnar talet som ett tal — de matar
 * inmatningsfält, och ett <input type="number"> kräver punkt.
 */
function num(value: number, lang: Lang): string {
  const rounded = round(value, DISPLAY_DECIMALS)
  if (Number.isInteger(rounded)) return String(rounded)
  return lang === 'sv' ? String(rounded).replace('.', ',') : String(rounded)
}

// ---------------------------------------------------------------- etiketter

export function weightLabel(imperial: boolean): string {
  return imperial ? 'lbs' : 'kg'
}

export function volumeLabel(imperial: boolean): string {
  return imperial ? 'fl oz' : 'ml'
}

export function foodMassLabel(imperial: boolean): string {
  return imperial ? 'oz' : 'g'
}

export function lengthLabel(imperial: boolean): string {
  return imperial ? 'in' : 'cm'
}

export function distanceLabel(imperial: boolean): string {
  return imperial ? 'miles' : 'km'
}

// ------------------------------------------------------------------- vikt

/**
 * Kilo → talet som visas.
 *
 * Rundar i BÅDA systemen. Metriskt gjorde det inte tidigare, vilket syntes så
 * fort en vikt matats in i pund: 225 lbs lagras som 102,0582 kg, och i
 * metriskt läge visades hela den strängen — både i texten "Förra: …" och
 * förifyllt i inmatningsfältet.
 */
export function toDisplayWeight(kg: number, imperial: boolean): number {
  return round(imperial ? kg / KG_PER_LBS : kg, DISPLAY_DECIMALS)
}

/** Det användaren skrev in → kilo att lagra. */
export function toStoreWeight(displayed: number, imperial: boolean): number {
  return imperial ? round(displayed * KG_PER_LBS, STORE_DECIMALS) : displayed
}

export function formatWeight(kg: number, imperial: boolean, lang: Lang = DEFAULT_LANG): string {
  return `${num(toDisplayWeight(kg, imperial), lang)} ${weightLabel(imperial)}`
}

// ------------------------------------------------------------------ volym

export function toDisplayVolume(ml: number, imperial: boolean): number {
  return round(imperial ? ml / ML_PER_FLOZ : ml, DISPLAY_DECIMALS)
}

export function toStoreVolume(displayed: number, imperial: boolean): number {
  return imperial ? Math.round(displayed * ML_PER_FLOZ) : displayed
}

/**
 * Vattenmängder i löpande text. Metriskt växlar till liter över 1000 ml, för
 * "2,5 L" läser bättre än "2500 ml"; imperial stannar i fl oz, som är hur
 * dryck mäts där.
 */
export function formatVolume(ml: number, imperial: boolean, lang: Lang = DEFAULT_LANG): string {
  if (imperial) return `${num(toDisplayVolume(ml, true), lang)} fl oz`
  return ml >= 1000 ? `${num(ml / 1000, lang)} L` : `${Math.round(ml)} ml`
}

// --------------------------------------------------------------- mat (massa)

export function toDisplayFoodMass(g: number, imperial: boolean): number {
  return round(imperial ? g / G_PER_OZ : g, DISPLAY_DECIMALS)
}

export function toStoreFoodMass(displayed: number, imperial: boolean): number {
  return imperial ? round(displayed * G_PER_OZ, STORE_DECIMALS) : displayed
}

export function formatFoodMass(g: number, imperial: boolean, lang: Lang = DEFAULT_LANG): string {
  return `${num(toDisplayFoodMass(g, imperial), lang)} ${foodMassLabel(imperial)}`
}

// ------------------------------------------------------------------ längd

export function toDisplayLength(cm: number, imperial: boolean): number {
  return round(imperial ? cm / CM_PER_INCH : cm, DISPLAY_DECIMALS)
}

export function toStoreLength(displayed: number, imperial: boolean): number {
  return imperial ? round(displayed * CM_PER_INCH, STORE_DECIMALS) : displayed
}

export function formatLength(cm: number, imperial: boolean, lang: Lang = DEFAULT_LANG): string {
  return `${num(toDisplayLength(cm, imperial), lang)} ${lengthLabel(imperial)}`
}

/**
 * Kroppslängd. Imperial anges i fot och tum, inte i 71 tum — ingen uppger sin
 * längd så. Avrundning sker på tummen, och 12 tum slår över till nästa fot så
 * resultatet aldrig blir 5'12".
 */
export function formatHeight(cm: number, imperial: boolean, lang: Lang = DEFAULT_LANG): string {
  if (!imperial) return `${Math.round(cm)} cm`
  const totalInches = Math.round(cm / CM_PER_INCH)
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${feet}'${inches}"`
}

// --------------------------------------------------------------- distans

export function toDisplayDistance(km: number, imperial: boolean): number {
  return round(imperial ? km / KM_PER_MILE : km, DISPLAY_DECIMALS)
}

export function toStoreDistance(displayed: number, imperial: boolean): number {
  return imperial ? round(displayed * KM_PER_MILE, STORE_DECIMALS) : displayed
}

export function formatDistance(km: number, imperial: boolean, lang: Lang = DEFAULT_LANG): string {
  return `${num(toDisplayDistance(km, imperial), lang)} ${distanceLabel(imperial)}`
}
