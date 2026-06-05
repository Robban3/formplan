import { useSettings } from './useSettings'

export function useUnits() {
  const { imperial } = useSettings()

  return {
    weightLabel: imperial ? 'lbs' : 'kg',
    distanceLabel: imperial ? 'miles' : 'km',
    toDisplay: (kg: number) =>
      imperial ? Math.round(kg * 2.20462 * 10) / 10 : kg,
    toStore: (displayed: number) =>
      imperial ? Math.round((displayed / 2.20462) * 10) / 10 : displayed,
    formatWeight: (kg: number) => {
      const val = imperial ? Math.round(kg * 2.20462 * 10) / 10 : kg
      return `${val} ${imperial ? 'lbs' : 'kg'}`
    },
  }
}
