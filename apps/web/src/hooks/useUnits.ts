import { useSettings } from './useSettings'
import * as units from '../lib/units'
import { resolveLang, deviceLanguages } from '../lib/i18n'

/**
 * Binder enhetsomvandlingen i lib/units.ts till användarens inställning, så
 * skärmarna slipper skicka med `imperial` i varje anrop.
 *
 * Namnen toDisplay/toStore/formatWeight är kvar från när hooken bara hanterade
 * vikt och används i det aktiva passet.
 */
export function useUnits() {
  const { imperial, language } = useSettings()
  // Decimaltecknet följer språket: "2,5 L" på svenska, "2.5 L" på engelska.
  const lang = resolveLang(language, deviceLanguages())

  return {
    imperial,
    lang,

    weightLabel: units.weightLabel(imperial),
    volumeLabel: units.volumeLabel(imperial),
    foodMassLabel: units.foodMassLabel(imperial),
    lengthLabel: units.lengthLabel(imperial),
    distanceLabel: units.distanceLabel(imperial),

    // Vikt
    toDisplay: (kg: number) => units.toDisplayWeight(kg, imperial),
    toStore: (displayed: number) => units.toStoreWeight(displayed, imperial),
    formatWeight: (kg: number) => units.formatWeight(kg, imperial, lang),

    // Volym (vatten)
    toDisplayVolume: (ml: number) => units.toDisplayVolume(ml, imperial),
    toStoreVolume: (displayed: number) => units.toStoreVolume(displayed, imperial),
    formatVolume: (ml: number) => units.formatVolume(ml, imperial, lang),

    // Massa (mat)
    toDisplayFoodMass: (g: number) => units.toDisplayFoodMass(g, imperial),
    toStoreFoodMass: (displayed: number) => units.toStoreFoodMass(displayed, imperial),
    formatFoodMass: (g: number) => units.formatFoodMass(g, imperial, lang),

    // Längd (kroppsmått)
    toDisplayLength: (cm: number) => units.toDisplayLength(cm, imperial),
    toStoreLength: (displayed: number) => units.toStoreLength(displayed, imperial),
    formatLength: (cm: number) => units.formatLength(cm, imperial, lang),
    formatHeight: (cm: number) => units.formatHeight(cm, imperial, lang),

    toDisplayDistance: (km: number) => units.toDisplayDistance(km, imperial),
    toStoreDistance: (displayed: number) => units.toStoreDistance(displayed, imperial),
    formatDistance: (km: number) => units.formatDistance(km, imperial, lang),
  }
}
