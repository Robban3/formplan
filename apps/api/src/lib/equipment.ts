/**
 * Översättning mellan profilens utrustningsval och övningskatalogens.
 *
 * Ligger i en EGEN fil och inte i exerciseCatalog.ts, som genereras av
 * scripts/build-exercise-catalog.mjs — handskriven logik där skrivs över
 * nästa gång generatorn körs, och CI fäller det (vilket den gjorde).
 *
 * Problemet den löser: profilen lagrar SVENSKA val ('Hantlar'), katalogen har
 * ENGELSKA värden ('dumbbell'). Utan översättningen kan ingen matchning ske,
 * och schemagenereringen föreslog skivstångsövningar till den som bara har
 * hantlar.
 */

import { EXERCISE_CATALOG, getExerciseById } from './exerciseCatalog'

/**
 * Profilens val → katalogens utrustningsvärden.
 *
 * 'other' kräver gym, trots att några av dess övningar (Dips, Mountain
 * climbers) inte behöver redskap. Katalogen skiljer inte på "behöver redskap"
 * och "behöver inget" inom den kategorin, och att omklassificera nio övningar
 * här skulle glida ifrån generatorn. Hör i datan, inte här.
 *
 * 'Gummiband' finns inte i katalogen alls — den användaren får
 * kroppsviktsövningar, vilket är bättre än att få kabelmaskiner föreslagna.
 */
const EQUIPMENT_FOR_PROFILE: Record<string, string[]> = {
  'Gym (fullutrustat)': ['barbell', 'dumbbell', 'machine', 'cable', 'kettlebells', 'e-z curl bar', 'other'],
  'Hantlar': ['dumbbell'],
  'Skivstång': ['barbell', 'e-z curl bar'],
  'Kettlebells': ['kettlebells'],
  'Chin-up stång': [],
  'Gummiband': [],
  'Inga redskap (kroppsvikt)': [],
}

/**
 * Värden som förekommit i verklig profildata utan att vara onboardingens
 * nuvarande val — äldre konton, testfixturer och mockdata.
 */
const EQUIPMENT_ALIASES: Record<string, string> = {
  'gym': 'Gym (fullutrustat)',
  'bodyweight': 'Inga redskap (kroppsvikt)',
  'kroppsvikt': 'Inga redskap (kroppsvikt)',
  'hantlar': 'Hantlar',
  'skivstång': 'Skivstång',
  'kettlebells': 'Kettlebells',
  'gummiband': 'Gummiband',
  'chin-up stång': 'Chin-up stång',
}

/** Kroppsvikt är alltid tillgängligt. */
const ALWAYS_ALLOWED = 'body only'

/** Varje utrustningsvärde katalogen innehåller. */
function allEquipment(): Set<string> {
  return new Set(EXERCISE_CATALOG.map((e) => e.equipment))
}

/**
 * Vilka av katalogens utrustningsvärden användaren faktiskt har.
 *
 * Två fall ger ingen filtrering alls:
 *
 * 1. Tom profil. Ett konto utan ifylld utrustning ska få ett fullt schema,
 *    inte bara armhävningar.
 * 2. Ett värde kartan inte känner. Då är kartan ofullständig, och att gissa
 *    är sämre än att inte filtrera — annars reduceras en användare med ett
 *    äldre eller felstavat värde tyst till kroppsvikt. Testfixturen hade
 *    'bodyweight' och mockdatan 'Gym', båda utanför onboardingens val, så
 *    det är inte ett teoretiskt fall.
 */
export function allowedEquipment(profileEquipment: readonly string[]): Set<string> {
  if (profileEquipment.length === 0) return allEquipment()

  const allowed = new Set<string>([ALWAYS_ALLOWED])
  for (const raw of profileEquipment) {
    const key = raw.trim()
    const canonical = EQUIPMENT_FOR_PROFILE[key] ? key : EQUIPMENT_ALIASES[key.toLowerCase()]
    const mapped = canonical ? EQUIPMENT_FOR_PROFILE[canonical] : undefined
    if (!mapped) {
      console.warn(`allowedEquipment: okänt utrustningsvärde ${JSON.stringify(raw)} — filtrerar inte`)
      return allEquipment()
    }
    for (const eq of mapped) allowed.add(eq)
  }
  return allowed
}

/** Får den här övningen föreslås med användarens utrustning? */
export function isExerciseAllowed(id: string, allowed: Set<string>): boolean {
  const ex = getExerciseById(id)
  return ex ? allowed.has(ex.equipment) : false
}
