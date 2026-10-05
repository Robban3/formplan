/**
 * Katalogens utrustningsvärden → text i användarens språk.
 *
 * Låg tidigare inne i ExerciseDetail. Flyttad hit när de färdiga programmen
 * behövde samma karta: en andra kopia hade varit samma driftbugg som resten
 * av kvällen gått åt till att rätta.
 *
 * Nycklarna är katalogens EGNA engelska värden ('body only', 'e-z curl bar')
 * och får inte ändras — de kommer ur övningsdatan.
 */

import type { TranslateFn } from './i18n'

export function equipmentLabels(t: TranslateFn): Record<string, string> {
  return {
    barbell: t('equipLabel.barbell'),
    dumbbell: t('equipLabel.dumbbell'),
    'body only': t('equipLabel.bodyOnly'),
    machine: t('equipLabel.machine'),
    cable: t('equipLabel.cable'),
    kettlebells: t('equipLabel.kettlebells'),
    'e-z curl bar': t('equipLabel.ezCurlBar'),
    bands: t('equipLabel.bands'),
    'medicine ball': t('equipLabel.medicineBall'),
    'exercise ball': t('equipLabel.exerciseBall'),
    'foam roll': t('equipLabel.foamRoll'),
    other: t('equipLabel.other'),
  }
}

/** Ett utrustningsvärde i text. Okänt värde visas som det är. */
export function equipmentLabel(equipment: string, t: TranslateFn): string {
  return equipmentLabels(t)[equipment] ?? equipment
}
