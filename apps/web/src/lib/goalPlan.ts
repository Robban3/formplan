import type { GoalMeta } from './goalTracker'

/**
 * Översätter ett mål till en ändring i träningsprofilen.
 *
 * Schemat genereras ur profilen (mål, nivå, utrustning, dagar per vecka) — inte
 * ur mållistan. Ett mål kan alltså bara styra schemat genom att ändra profilen,
 * och bara de mål som faktiskt säger något om HUR man ska träna kan göra det.
 *
 * "Dricka 2,5 liter vatten per dag", "Klara 50 pass totalt" och fritextmål säger
 * ingenting om upplägget. Returnerar null för dem — en knapp på de målen hade
 * lovat något appen inte kan hålla.
 */

export interface PlanAdjustment {
  /** Fälten som ska skrivas över i profilen. */
  patch: { goal?: string; days_per_week?: number }
  /** Vad användaren får läsa i bekräftelsen, innan schemat ersätts. */
  description: string
}

const GOAL_TEXT: Record<string, string> = {
  lose_weight: 'Gå ner i vikt',
  build_muscle: 'Bygga muskler',
  maintain: 'Hålla formen',
}

/**
 * @param meta            målet, tolkat av goalTracker
 * @param currentWeightKg senast loggade vikt — behövs för att veta åt vilket
 *                        håll "Väga 75 kg" pekar. Saknas den går målet inte att
 *                        tolka, och då erbjuds ingen anpassning.
 */
export function planAdjustmentForGoal(
  meta: GoalMeta | undefined,
  currentWeightKg: number | null
): PlanAdjustment | null {
  if (!meta) return null

  switch (meta.type) {
    case 'weight_loss':
      return {
        patch: { goal: 'lose_weight' },
        description: `Målet i din profil ändras till "${GOAL_TEXT.lose_weight}".`,
      }

    case 'weight_target': {
      // Utan känd vikt går det inte att avgöra om målet är upp eller ner.
      if (currentWeightKg == null || !Number.isFinite(currentWeightKg)) return null
      const diff = meta.targetValue - currentWeightKg
      // Ett halvkilo åt endera hållet är brus, inte en riktning.
      const goal = Math.abs(diff) < 0.5 ? 'maintain' : diff < 0 ? 'lose_weight' : 'build_muscle'
      return {
        patch: { goal },
        description: `Du väger ${currentWeightKg} kg och målet är ${meta.targetValue} kg. Målet i din profil ändras till "${GOAL_TEXT[goal]}".`,
      }
    }

    case 'training_weekly': {
      const days = Math.round(meta.targetValue)
      if (!Number.isFinite(days) || days < 1 || days > 7) return null
      return {
        patch: { days_per_week: days },
        description: `Schemat byggs om för ${days} träningsdagar i veckan.`,
      }
    }

    // water_daily, training_total och manual säger inget om upplägget.
    default:
      return null
  }
}
