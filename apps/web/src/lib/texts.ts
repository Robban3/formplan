/**
 * Delad svensk text.
 *
 * Här ligger kopia som används på FLER ÄN ETT ställe, plus etikettkartorna för
 * de värden som lagras som nyckelord. Enskilda meningar som bara finns i en
 * skärm står kvar i sin JSX — att flytta dem hit gör inte appen mer korrekt,
 * bara svårare att läsa.
 *
 * Måltidsetiketterna fanns i ÅTTA identiska kopior (hemskärmen, matdagboken,
 * veckoplanen, makrosidan, fotoanalysen, streckkodsskannern, livsmedelssöket
 * och måltidssektionen). De var lika den här gången; nästa gång någon rättar
 * en av dem hade de inte varit det.
 *
 * Nyckelorden är de värden som ligger i databasen och får inte ändras —
 * `mellanmar` är felstavat, men lagrade rader slutar matcha om det rättas.
 */

import type { MealSlot } from './nutritionApi'

// ------------------------------------------------------------- etikettkartor

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  frukost: 'Frukost',
  lunch: 'Lunch',
  middag: 'Middag',
  mellanmar: 'Mellanmål',
}

/** Träningsmål. Nycklarna speglar `fitness_profile.goal`. */
export const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Gå ner i vikt',
  build_muscle: 'Bygga muskler',
  maintain: 'Hålla formen',
  improve_endurance: 'Förbättra kondition',
}

/** Erfarenhetsnivå. Nycklarna speglar `fitness_profile.level`. */
export const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Nybörjare',
  intermediate: 'Mellannivå',
  advanced: 'Avancerad',
}

/** Kostinriktning i måltidsplaneraren. */
export const DIET_FOCUS_LABELS: Record<string, string> = {
  balanced: 'Balanserat',
  high_protein: 'Hög protein',
  vegetarian: 'Vegetarisk',
  low_carb: 'Låg kolhydrat',
}

// ------------------------------------------------------------- gemensam kopia

/** Reservtext när ett fel saknar eget meddelande. */
export const GENERIC_ERROR = 'Något gick fel'

/** Knapptext medan något sparas. */
export const BUSY_ADDING = 'Lägger till…'

/** Återställnings- och inbjudningslänkar är engångs och kan hinna gå ut. */
export const LINK_EXPIRED = 'Länken har gått ut eller är redan använd. Begär en ny.'

/** Mål som appen kan följa själv, kontra sådana användaren får bocka av. */
export const TRACKING_AUTOMATIC = 'Automatisk spårning ✓'
export const TRACKING_MANUAL = 'Manuellt'

/**
 * Förslagen på målsidan.
 *
 * OBS: texten tolkas av goalTracker, som läser siffran OCH enheten ur
 * strängen ("Gå ner 5 kg", "Dricka 2,5 liter"). Förslagen är därför metriska
 * även för den som valt imperialt — skrevs de om till pund och gallon skulle
 * tolkningen sluta känna igen dem, och målet bli ospårbart. Ska imperiala mål
 * stödjas måste goalTracker lära sig enheterna först.
 */
export const GOAL_SUGGESTIONS: { text: string; hint: string }[] = [
  { text: 'Träna 3 gånger i veckan', hint: TRACKING_AUTOMATIC },
  { text: 'Träna 4 gånger i veckan', hint: TRACKING_AUTOMATIC },
  { text: 'Dricka 2,5 liter vatten per dag', hint: TRACKING_AUTOMATIC },
  { text: 'Dricka 2 liter vatten per dag', hint: TRACKING_AUTOMATIC },
  { text: 'Gå ner 5 kg', hint: TRACKING_AUTOMATIC },
  { text: 'Väga 75 kg', hint: TRACKING_AUTOMATIC },
  { text: 'Klara 50 pass totalt', hint: TRACKING_AUTOMATIC },
  { text: 'Springa 5 km utan paus', hint: TRACKING_MANUAL },
  { text: 'Klara 10 pull-ups i rad', hint: TRACKING_MANUAL },
]
