/**
 * Förslagen på målsidan.
 *
 * Beror på BÅDE språk och enhet: texten tolkas tillbaka av goalTracker, som
 * läser siffran och enheten ur strängen. Ett förslag måste därför skrivas på
 * ett språk tolkaren kan och i den enhet användaren valt — annars föreslår
 * appen ett mål den sedan inte kan följa.
 *
 * `auto` är ett eget fält, inte något som läses ur hint-texten. Målsidan
 * filtrerade tidigare på `hint.includes('Auto')`, vilket fungerade så länge
 * appen bara fanns på svenska: den engelska hinten är "Tracked automatically"
 * med litet a, och filtret hade tömt listan.
 */

import type { TextKey, TranslateFn } from './i18n'

export interface GoalSuggestion {
  text: string
  hint: string
  /** Sant när goalTracker kan följa målet utan att användaren bockar av det. */
  auto: boolean
}

/** Nyckeln per enhetssystem, för de förslag som innehåller ett mått. */
type Variant = { metric: TextKey; imperial: TextKey }

const PLAIN: { key: TextKey; auto: boolean }[] = [
  { key: 'goals.suggest.weekly3', auto: true },
  { key: 'goals.suggest.weekly4', auto: true },
  { key: 'goals.suggest.total50', auto: true },
  { key: 'goals.suggest.pullups', auto: false },
]

const VARIANTS: { key: Variant; auto: boolean }[] = [
  {
    key: {
      metric: 'goals.suggest.water.metric.high',
      imperial: 'goals.suggest.water.imperial.high',
    },
    auto: true,
  },
  {
    key: {
      metric: 'goals.suggest.water.metric.low',
      imperial: 'goals.suggest.water.imperial.low',
    },
    auto: true,
  },
  {
    key: { metric: 'goals.suggest.lose.metric', imperial: 'goals.suggest.lose.imperial' },
    auto: true,
  },
  {
    key: { metric: 'goals.suggest.weigh.metric', imperial: 'goals.suggest.weigh.imperial' },
    auto: true,
  },
  {
    // Distans följs inte automatiskt — loggen har ingen löpsträcka att jämföra
    // mot — men enheten ska ändå stämma med resten av appen.
    key: { metric: 'goals.suggest.run.metric', imperial: 'goals.suggest.run.imperial' },
    auto: false,
  },
]

/** Ordningen användaren ser dem i: veckomål, vatten, vikt, totalt, manuella. */
const ORDER: TextKey[] = [
  'goals.suggest.weekly3',
  'goals.suggest.weekly4',
  'goals.suggest.water.metric.high',
  'goals.suggest.water.metric.low',
  'goals.suggest.lose.metric',
  'goals.suggest.weigh.metric',
  'goals.suggest.total50',
  'goals.suggest.run.metric',
  'goals.suggest.pullups',
]

export function goalSuggestions(t: TranslateFn, imperial: boolean): GoalSuggestion[] {
  const byMetricKey = new Map<TextKey, GoalSuggestion>()

  for (const { key, auto } of PLAIN) {
    byMetricKey.set(key, {
      text: t(key),
      hint: t(auto ? 'goals.trackingAutomatic' : 'goals.trackingManual'),
      auto,
    })
  }
  for (const { key, auto } of VARIANTS) {
    byMetricKey.set(key.metric, {
      text: t(imperial ? key.imperial : key.metric),
      hint: t(auto ? 'goals.trackingAutomatic' : 'goals.trackingManual'),
      auto,
    })
  }

  return ORDER.map((k) => byMetricKey.get(k)).filter((s): s is GoalSuggestion => s !== undefined)
}
