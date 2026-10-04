/**
 * Numeriska gränser och standardvärden.
 *
 * Låg tidigare som literaler i de skärmar som råkade behöva dem, vilket gjorde
 * att samma gräns kunde glida isär: viktinmatningen i Analys godtog 20–300
 * medan onboardingen godtog 30–300, utan att något sa vilken som gällde.
 *
 * Alla värden är METRISKA — de är gränser för det som LAGRAS. Skärmar som
 * matar in i imperial räknar om gränserna med lib/units.ts innan de sätts på
 * fältet, annars skulle max=300 neka en vikt i pund.
 */

// ------------------------------------------------------------------- kropp

/** Rimlig kroppsvikt i kilo. Fångar felskrivningar, inte extremfall. */
export const WEIGHT_MIN_KG = 20
export const WEIGHT_MAX_KG = 300
export const WEIGHT_STEP_KG = 0.1

/** Kroppslängd i centimeter. */
export const HEIGHT_MIN_CM = 100
export const HEIGHT_MAX_CM = 250
export const HEIGHT_STEP_CM = 1

/** Ålder i år. Nedre gränsen följer åldersgränsen i integritetspolicyn. */
export const AGE_MIN_YEARS = 13
export const AGE_MAX_YEARS = 120

// ------------------------------------------------------------------ vatten

/** Dagligt vattenmål i milliliter. */
export const WATER_GOAL_MIN_ML = 500
export const WATER_GOAL_MAX_ML = 6000
export const WATER_GOAL_STEP_ML = 250
/** Steget när målet matas in i fl oz — ungefär ett glas. */
export const WATER_GOAL_STEP_FLOZ = 8

/** Mängden som snabbknappen på hemskärmen loggar. */
export const WATER_QUICK_ADD_ML = 250
/** Valen på vattensidan, i milliliter. */
export const WATER_QUICK_OPTIONS_ML = [125, 250, 500, 750, 1000]

// -------------------------------------------------------------------- kost

/** Proteinmål i gram per dag. */
export const PROTEIN_GOAL_MIN_G = 20
export const PROTEIN_GOAL_MAX_G = 500
export const PROTEIN_GOAL_STEP_G = 5

/**
 * Näringsvärden anges per 100 gram, både av Open Food Facts och på
 * näringsdeklarationer. Faktorn mellan en portion och tabellvärdet.
 */
export const NUTRITION_BASIS_G = 100

// ---------------------------------------------------------------- träning

/** Standardvärden när en övning läggs till i ett eget pass. */
export const DEFAULT_SETS = 3
export const DEFAULT_REPS = '10'
export const DEFAULT_REST_SECONDS = 60
