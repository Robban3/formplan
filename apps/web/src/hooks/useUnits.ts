import { useSettings } from './useSettings'
import * as units from '../lib/units'

/**
 * Binder enhetsomvandlingen i lib/units.ts till användarens inställning, så
 * skärmarna slipper skicka med `imperial` i varje anrop.
 *
 * Namnen toDisplay/toStore/formatWeight är kvar från när hooken bara hanterade
 * vikt och används i det aktiva passet.
 */
export function useUnits() {
  const { imperial } = useSettings()

  return {
    imperial,

    weightLabel: units.weightLabel(imperial),
    volumeLabel: units.volumeLabel(imperial),
    foodMassLabel: units.foodMassLabel(imperial),
    lengthLabel: units.lengthLabel(imperial),
    distanceLabel: units.distanceLabel(imperial),

    // Vikt
    toDisplay: (kg: number) => units.toDisplayWeight(kg, imperial),
    toStore: (displayed: number) => units.toStoreWeight(displayed, imperial),
    formatWeight: (kg: number) => units.formatWeight(kg, imperial),

    // Volym (vatten)
    toDisplayVolume: (ml: number) => units.toDisplayVolume(ml, imperial),
    toStoreVolume: (displayed: number) => units.toStoreVolume(displayed, imperial),
    formatVolume: (ml: number) => units.formatVolume(ml, imperial),

    // Massa (mat)
    toDisplayFoodMass: (g: number) => units.toDisplayFoodMass(g, imperial),
    toStoreFoodMass: (displayed: number) => units.toStoreFoodMass(displayed, imperial),
    formatFoodMass: (g: number) => units.formatFoodMass(g, imperial),

    // Längd (kroppsmått)
    toDisplayLength: (cm: number) => units.toDisplayLength(cm, imperial),
    toStoreLength: (displayed: number) => units.toStoreLength(displayed, imperial),
    formatLength: (cm: number) => units.formatLength(cm, imperial),
    formatHeight: (cm: number) => units.formatHeight(cm, imperial),

    formatDistance: (km: number) => units.formatDistance(km, imperial),
  }
}
