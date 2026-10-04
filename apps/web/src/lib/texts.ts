/**
 * Övergångslager mot lib/i18n.
 *
 * Strängarna bor i lib/i18n/sv.ts och lib/i18n/en.ts. Den här filen plockar ut
 * dem på svenska för de skärmar som ÄNNU INTE är kopplade till `useT()`. Den
 * finns bara så att ingen sträng behöver existera i två exemplar under
 * omläggningen — en skärm i taget flyttas till `useT()`, och när den sista är
 * flyttad kan filen tas bort.
 *
 * Lägg inte till nya strängar här. De ska in i sv.ts och en.ts.
 */

import type { MealSlot } from './nutritionApi'
import { translate, type Lang, type TranslateFn } from './i18n'

const svT: TranslateFn = (key, vars) => translate('sv', key, vars)

/** Etiketterna för ett språk. Skärmar med `useT()` använder den här. */
export function mealSlotLabels(t: TranslateFn): Record<MealSlot, string> {
  return {
    frukost: t('meal.frukost'),
    lunch: t('meal.lunch'),
    middag: t('meal.middag'),
    mellanmar: t('meal.mellanmar'),
  }
}

export function goalLabels(t: TranslateFn): Record<string, string> {
  return {
    lose_weight: t('goal.lose_weight'),
    build_muscle: t('goal.build_muscle'),
    maintain: t('goal.maintain'),
    improve_endurance: t('goal.improve_endurance'),
  }
}

export function levelLabels(t: TranslateFn): Record<string, string> {
  return {
    beginner: t('level.beginner'),
    intermediate: t('level.intermediate'),
    advanced: t('level.advanced'),
  }
}

// ---------------------------------------------------- svenska, för det som väntar

export const MEAL_SLOT_LABELS = mealSlotLabels(svT)
export const GOAL_LABELS = goalLabels(svT)
export const LEVEL_LABELS = levelLabels(svT)

export const GENERIC_ERROR = svT('common.error')
export const BUSY_ADDING = svT('common.adding')
export const LINK_EXPIRED = svT('auth.linkExpired')
export const TRACKING_AUTOMATIC = svT('goals.trackingAutomatic')
export const TRACKING_MANUAL = svT('goals.trackingManual')

/** Språken som finns, för språkväljaren i inställningarna. */
export function languageLabel(t: TranslateFn, lang: Lang | 'auto'): string {
  return t(
    lang === 'auto'
      ? 'settings.language.auto'
      : lang === 'sv'
        ? 'settings.language.sv'
        : 'settings.language.en'
  )
}
