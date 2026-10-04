import { getLocalSessions } from './workoutSessionStore'
import { getLocalWater } from './waterStore'
import { getWeightEntries } from './weightStore'
import { dateKey, sessionsCountThisWeek } from './derive'
import { formatWeight, formatVolume } from './units'
import type { TranslateFn, Lang } from './i18n'
import {
  NUMBER_PATTERN,
  WEIGHT_UNIT_PATTERN,
  VOLUME_UNIT_PATTERN,
  parseNumber,
  weightToKg,
  volumeToMl,
} from './goalUnits'

export type GoalType =
  | 'training_weekly'   // Träna X gånger i veckan
  | 'training_total'    // Klara X pass totalt
  | 'water_daily'       // Dricka X liter vatten per dag
  | 'weight_target'     // Väga X kg / nå X kg
  | 'weight_loss'       // Gå ner X kg
  | 'manual'            // Allt annat

export interface GoalMeta {
  type: GoalType
  /**
   * Målvärdet, ALLTID metriskt: antal pass, milliliter eller kilo. Texten kan
   * vara skriven i pund, gallon eller fl oz — det normaliseras här, eftersom
   * computeAutoProgress jämför mot lagrad data som är metrisk.
   */
  targetValue: number
  /** Den kanoniska enheten för targetValue, inte den användaren skrev. */
  unit: string
}

// Verben på båda språken. Appen är tvåspråkig, så en engelsk användare skriver
// "lose 10 lbs" — känner tolkaren inte igen det blir målet ospårbart, utan att
// något säger varför.
const V_TRAIN = 'träna|tränar|train|work\\s*out|workout'
const V_DRINK = 'dricka|drick|drink'
const V_WEIGH = 'väga|nå|komma till|komma ner till|ner till|weigh|reach|get to|get down to'
const V_LOSE = 'gå ner|tappa|förlora|minska|lose|drop|shed'
const V_COMPLETE = 'klara|genomföra|göra|complete|finish|do'
const N_SESSION = 'pass|gånger|ggr|träningar|workouts?|sessions?|times'
const N_WEEK = 'vecka|veckan|week'

/** Parses a goal text and returns its type + target value. */
export function parseGoal(text: string): GoalMeta {
  const t = text.toLowerCase()

  // Weekly training: "träna 3 gånger i veckan", "4 pass i veckan", "träna 4 ggr/vecka"
  const weeklyMatch =
    t.match(new RegExp(`(?:${V_TRAIN})\\s+(\\d+)\\s*(?:${N_SESSION})\\s*/?\\s*(?:i|per|a)?\\s*(?:${N_WEEK})`, 'i')) ||
    t.match(new RegExp(`(\\d+)\\s*(?:${N_SESSION})\\s*/?\\s*(?:i|per|a)?\\s*(?:${N_WEEK})`, 'i'))
  if (weeklyMatch) {
    const n = parseInt(weeklyMatch[1] ?? weeklyMatch[0])
    if (!isNaN(n) && n > 0) return { type: 'training_weekly', targetValue: n, unit: 'pass/vecka' }
  }

  // Water: "dricka 2 liter", "2,5 L vatten per dag", "2 liter om dagen"
  // (?![a-zåäöé]) so "5 löppass" never parses as liters, and "10 lbs" never
  // matches the single-letter unit "l" followed by "bs".
  const waterUnitMatch = t.match(
    new RegExp(`(${NUMBER_PATTERN})\\s*(${VOLUME_UNIT_PATTERN})(?![a-zåäöé])`, 'i')
  )
  if (waterUnitMatch) {
    const ml = volumeToMl(parseNumber(waterUnitMatch[1]), waterUnitMatch[2])
    // Övre gränsen fångar felskrivningar; 20 liter är inte ett dagsmål.
    if (ml !== null && ml > 0 && ml <= 20_000) {
      return { type: 'water_daily', targetValue: Math.round(ml), unit: 'ml/dag' }
    }
  }
  // Enbart ett tal efter drickverbet: tolkas som liter, som tidigare.
  const waterBareMatch = t.match(new RegExp(`(?:${V_DRINK})\\s+(${NUMBER_PATTERN})`, 'i'))
  if (waterBareMatch) {
    const liters = parseNumber(waterBareMatch[1])
    if (!isNaN(liters) && liters > 0 && liters < 20) {
      return { type: 'water_daily', targetValue: Math.round(liters * 1000), unit: 'ml/dag' }
    }
  }

  // Weight target: "väga 75 kg", "nå 70 kg", "komma ner till 65 kg"
  const weightTargetMatch = t.match(
    new RegExp(`(?:${V_WEIGH})\\s+(${NUMBER_PATTERN})\\s*(${WEIGHT_UNIT_PATTERN})\\b`, 'i')
  )
  if (weightTargetMatch) {
    const kg = weightToKg(parseNumber(weightTargetMatch[1]), weightTargetMatch[2])
    if (kg !== null && kg > 0) {
      return { type: 'weight_target', targetValue: round1(kg), unit: 'kg' }
    }
  }

  // Weight loss: "gå ner X kg", "tappa X kg", "förlora X kg"
  const weightLossMatch = t.match(
    new RegExp(`(?:${V_LOSE})\\s+(${NUMBER_PATTERN})\\s*(${WEIGHT_UNIT_PATTERN})\\b`, 'i')
  )
  if (weightLossMatch) {
    const kg = weightToKg(parseNumber(weightLossMatch[1]), weightLossMatch[2])
    if (kg !== null && kg > 0) {
      return { type: 'weight_loss', targetValue: round1(kg), unit: 'kg' }
    }
  }

  // Total sessions: "klara 50 pass", "genomföra 20 träningar"
  const totalMatch =
    t.match(new RegExp(`(?:${V_COMPLETE})\\s+(\\d+)\\s*(?:${N_SESSION})`, 'i')) ||
    t.match(new RegExp(`(\\d+)\\s*(?:${N_SESSION})\\s*(?:totalt|total|in all)?`, 'i'))
  if (totalMatch) {
    const n = parseInt(totalMatch[1] as string)
    if (!isNaN(n) && n > 0 && n < 1000) return { type: 'training_total', targetValue: n, unit: 'pass' }
  }

  return { type: 'manual', targetValue: 0, unit: '' }
}

/** Pund ger sällan jämna kilo — en decimal räcker och läser bättre. */
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Computes current progress (0–100) for a goal based on live data. */
export function computeAutoProgress(meta: GoalMeta): number | null {
  if (meta.type === 'manual' || meta.targetValue <= 0) return null

  // Local date — the water log stores entries under the user's local day,
  // so a UTC date here would read the wrong bucket between 00:00 and 02:00.
  const today = dateKey()

  switch (meta.type) {
    case 'training_weekly': {
      const sessions = getLocalSessions()
      const done = sessionsCountThisWeek(sessions.map((s) => s.completed_at))
      return Math.min(100, Math.round((done / meta.targetValue) * 100))
    }
    case 'training_total': {
      const total = getLocalSessions().length
      return Math.min(100, Math.round((total / meta.targetValue) * 100))
    }
    case 'water_daily': {
      const { total_ml } = getLocalWater(today)
      return Math.min(100, Math.round((total_ml / meta.targetValue) * 100))
    }
    case 'weight_target': {
      const entries = getWeightEntries()
      if (entries.length === 0) return null
      const current = entries[entries.length - 1]!.weight_kg
      const start = entries[0]!.weight_kg
      const target = meta.targetValue
      if (start === target) return current === target ? 100 : 0
      const totalNeeded = Math.abs(start - target)
      // Signed progress along the target direction: movement toward the target
      // counts, movement away (e.g. gaining weight when the goal is to lose)
      // reads as 0 — never as full progress.
      const done = target > start ? current - start : start - current
      return Math.max(0, Math.min(100, Math.round((done / totalNeeded) * 100)))
    }
    case 'weight_loss': {
      const entries = getWeightEntries()
      if (entries.length < 2) return null
      const start = entries[0]!.weight_kg
      const current = entries[entries.length - 1]!.weight_kg
      const lost = start - current
      if (lost <= 0) return 0
      return Math.min(100, Math.round((lost / meta.targetValue) * 100))
    }
    default:
      return null
  }
}

/**
 * Live-status, t.ex. "2 av 4 pass denna vecka".
 *
 * Tar `t` och `imperial` i stället för att läsa dem själv: funktionen är ren
 * och testas utan att rendera något. Målvärdet är metriskt; formateringen
 * vänder det till användarens enhet.
 */
export function goalStatusText(
  meta: GoalMeta,
  { t: tr, imperial, lang }: { t: TranslateFn; imperial: boolean; lang: Lang }
): string | null {
  if (meta.type === 'manual' || meta.targetValue <= 0) return null
  // Local date — the water log stores entries under the user's local day,
  // so a UTC date here would read the wrong bucket between 00:00 and 02:00.
  const today = dateKey()

  switch (meta.type) {
    case 'training_weekly': {
      const done = sessionsCountThisWeek(getLocalSessions().map((s) => s.completed_at))
      return tr('goals.status.weekly', { done, target: meta.targetValue })
    }
    case 'training_total': {
      const total = getLocalSessions().length
      return tr('goals.status.total', { done: total, target: meta.targetValue })
    }
    case 'water_daily': {
      const { total_ml } = getLocalWater(today)
      return tr('goals.status.water', {
        done: formatVolume(total_ml, imperial, lang),
        target: formatVolume(meta.targetValue, imperial, lang),
      })
    }
    case 'weight_target': {
      const entries = getWeightEntries()
      if (!entries.length) return tr('goals.status.needWeight')
      const current = entries[entries.length - 1]!.weight_kg
      return tr('goals.status.weightTarget', {
        current: formatWeight(current, imperial, lang),
        target: formatWeight(meta.targetValue, imperial, lang),
      })
    }
    case 'weight_loss': {
      const entries = getWeightEntries()
      if (entries.length < 2) return tr('goals.status.needWeight')
      const lost = entries[0]!.weight_kg - entries[entries.length - 1]!.weight_kg
      return tr('goals.status.weightLoss', {
        done: formatWeight(Math.max(0, lost), imperial, lang),
        target: formatWeight(meta.targetValue, imperial, lang),
      })
    }
    default:
      return null
  }
}
