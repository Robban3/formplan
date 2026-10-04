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

// Exakta definitioner, inte avrundade faktorer. Med 2.20462 i stället för
// 1/0.45359237 hamnade 225 lbs på 102,0584 kg i stället för 102,0583 — litet,
// men det är gratis att ha rätt.

/** 1 pund i kilo (exakt per internationell definition). */
export const KG_PER_LBS = 0.45359237
/** 1 US fluid ounce i milliliter (exakt: 1/128 US gallon). */
export const ML_PER_FLOZ = 29.5735295625
/** 1 ounce i gram (exakt: 1/16 pund). */
export const G_PER_OZ = 28.349523125
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

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Tal i text. Svenskt decimalkomma, som resten av gränssnittet, och ett
 * avslutande ",0" tas bort så det står "100 kg" och inte "100,0 kg".
 *
 * Numeriska toDisplay*-funktioner lämnar talet som ett tal — de matar
 * inmatningsfält, och ett <input type="number"> kräver punkt.
 */
function sv(value: number): string {
  const rounded = round(value, DISPLAY_DECIMALS)
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace('.', ',')
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

export function formatWeight(kg: number, imperial: boolean): string {
  return `${sv(toDisplayWeight(kg, imperial))} ${weightLabel(imperial)}`
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
export function formatVolume(ml: number, imperial: boolean): string {
  if (imperial) return `${sv(toDisplayVolume(ml, true))} fl oz`
  return ml >= 1000 ? `${sv(ml / 1000)} L` : `${Math.round(ml)} ml`
}

// --------------------------------------------------------------- mat (massa)

export function toDisplayFoodMass(g: number, imperial: boolean): number {
  return round(imperial ? g / G_PER_OZ : g, DISPLAY_DECIMALS)
}

export function toStoreFoodMass(displayed: number, imperial: boolean): number {
  return imperial ? round(displayed * G_PER_OZ, STORE_DECIMALS) : displayed
}

export function formatFoodMass(g: number, imperial: boolean): string {
  return `${sv(toDisplayFoodMass(g, imperial))} ${foodMassLabel(imperial)}`
}

// ------------------------------------------------------------------ längd

export function toDisplayLength(cm: number, imperial: boolean): number {
  return round(imperial ? cm / CM_PER_INCH : cm, DISPLAY_DECIMALS)
}

export function toStoreLength(displayed: number, imperial: boolean): number {
  return imperial ? round(displayed * CM_PER_INCH, STORE_DECIMALS) : displayed
}

export function formatLength(cm: number, imperial: boolean): string {
  return `${sv(toDisplayLength(cm, imperial))} ${lengthLabel(imperial)}`
}

/**
 * Kroppslängd. Imperial anges i fot och tum, inte i 71 tum — ingen uppger sin
 * längd så. Avrundning sker på tummen, och 12 tum slår över till nästa fot så
 * resultatet aldrig blir 5'12".
 */
export function formatHeight(cm: number, imperial: boolean): string {
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

export function formatDistance(km: number, imperial: boolean): string {
  return `${sv(toDisplayDistance(km, imperial))} ${distanceLabel(imperial)}`
}
