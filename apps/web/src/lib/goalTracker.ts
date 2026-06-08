import { getLocalSessions } from './workoutSessionStore'
import { getLocalWater } from './waterStore'
import { getWeightEntries } from './weightStore'
import { sessionsCountThisWeek } from './derive'

export type GoalType =
  | 'training_weekly'   // Träna X gånger i veckan
  | 'training_total'    // Klara X pass totalt
  | 'water_daily'       // Dricka X liter vatten per dag
  | 'weight_target'     // Väga X kg / nå X kg
  | 'weight_loss'       // Gå ner X kg
  | 'manual'            // Allt annat

export interface GoalMeta {
  type: GoalType
  targetValue: number   // the extracted number (sessions, ml, kg…)
  unit: string
}

/** Parses a goal text and returns its type + target value. */
export function parseGoal(text: string): GoalMeta {
  const t = text.toLowerCase()

  // Weekly training: "träna 3 gånger i veckan", "4 pass i veckan", "träna 4 ggr/vecka"
  const weeklyMatch =
    t.match(/träna\s+(\d+)\s*(gånger|ggr|pass)\s*(i|per)?\s*vecka/i) ||
    t.match(/(\d+)\s*(pass|gånger|ggr)\s*(i|per)\s*vecka/i) ||
    t.match(/(\d+)\s*gånger\s*i\s*veckan/i)
  if (weeklyMatch) {
    const n = parseInt(weeklyMatch[1] ?? weeklyMatch[0])
    if (!isNaN(n) && n > 0) return { type: 'training_weekly', targetValue: n, unit: 'pass/vecka' }
  }

  // Water: "dricka 2 liter", "2,5 L vatten per dag", "2 liter om dagen"
  const waterMatch =
    t.match(/(\d+[,.]\d*|\d+)\s*(liter|l)\s*(vatten)?/i) ||
    t.match(/dricka\s+(\d+[,.]\d*|\d+)/i)
  if (waterMatch) {
    const raw = (waterMatch[1] ?? '').replace(',', '.')
    const liters = parseFloat(raw)
    if (!isNaN(liters) && liters > 0 && liters < 20) {
      return { type: 'water_daily', targetValue: Math.round(liters * 1000), unit: 'ml/dag' }
    }
  }

  // Weight target: "väga 75 kg", "nå 70 kg", "komma ner till 65 kg"
  const weightTargetMatch =
    t.match(/väga\s+(\d+[,.]\d*|\d+)\s*kg/i) ||
    t.match(/(nå|komma till|komma ner till|ner till)\s+(\d+[,.]\d*|\d+)\s*kg/i)
  if (weightTargetMatch) {
    const raw = (weightTargetMatch[2] ?? weightTargetMatch[1] ?? '').replace(',', '.')
    const kg = parseFloat(raw)
    if (!isNaN(kg) && kg > 0) return { type: 'weight_target', targetValue: kg, unit: 'kg' }
  }

  // Weight loss: "gå ner X kg", "tappa X kg", "förlora X kg"
  const weightLossMatch =
    t.match(/(gå ner|tappa|förlora|minska)\s+(\d+[,.]\d*|\d+)\s*kg/i)
  if (weightLossMatch) {
    const raw = (weightLossMatch[2] ?? '').replace(',', '.')
    const kg = parseFloat(raw)
    if (!isNaN(kg) && kg > 0) return { type: 'weight_loss', targetValue: kg, unit: 'kg' }
  }

  // Total sessions: "klara 50 pass", "genomföra 20 träningar"
  const totalMatch =
    t.match(/(klara|genomföra|göra)\s+(\d+)\s*(pass|träningar)/i) ||
    t.match(/(\d+)\s*(pass|träningar)\s*(totalt)?/i)
  if (totalMatch) {
    const n = parseInt(totalMatch[2] ?? totalMatch[1])
    if (!isNaN(n) && n > 0 && n < 1000) return { type: 'training_total', targetValue: n, unit: 'pass' }
  }

  return { type: 'manual', targetValue: 0, unit: '' }
}

/** Computes current progress (0–100) for a goal based on live data. */
export function computeAutoProgress(meta: GoalMeta): number | null {
  if (meta.type === 'manual' || meta.targetValue <= 0) return null

  const today = new Date().toISOString().slice(0, 10)

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
      const done = Math.abs(start - current)
      // Clamp: don't go negative if user went the wrong direction
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

/** Human-readable live status string, e.g. "2 av 4 pass denna vecka" */
export function goalStatusText(meta: GoalMeta): string | null {
  if (meta.type === 'manual' || meta.targetValue <= 0) return null
  const today = new Date().toISOString().slice(0, 10)

  switch (meta.type) {
    case 'training_weekly': {
      const done = sessionsCountThisWeek(getLocalSessions().map((s) => s.completed_at))
      return `${done} av ${meta.targetValue} pass denna vecka`
    }
    case 'training_total': {
      const total = getLocalSessions().length
      return `${total} av ${meta.targetValue} pass totalt`
    }
    case 'water_daily': {
      const { total_ml } = getLocalWater(today)
      return `${(total_ml / 1000).toFixed(1).replace('.', ',')} av ${(meta.targetValue / 1000).toFixed(1).replace('.', ',')} L idag`
    }
    case 'weight_target': {
      const entries = getWeightEntries()
      if (!entries.length) return 'Logga vikt i Analys → Trender'
      const current = entries[entries.length - 1]!.weight_kg
      return `${current.toFixed(1).replace('.', ',')} kg nu · mål ${meta.targetValue} kg`
    }
    case 'weight_loss': {
      const entries = getWeightEntries()
      if (entries.length < 2) return 'Logga vikt i Analys → Trender'
      const lost = entries[0]!.weight_kg - entries[entries.length - 1]!.weight_kg
      return `${Math.max(0, lost).toFixed(1).replace('.', ',')} av ${meta.targetValue} kg tappat`
    }
    default:
      return null
  }
}
