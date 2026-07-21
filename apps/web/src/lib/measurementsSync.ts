// Håller vikt- och kroppsmåtts-historiken synkad mot servern så den överlever
// cache-rensning, enhetsbyte och flytten till native-appen. Lokalt är alltid
// källan för UI:t — serverfel får aldrig påverka upplevelsen.

import { measurementsApi } from './measurementsApi'
import { getMeasurements, mergeServerMeasurements } from './measurementStore'
import { getWeightEntries, mergeServerWeights } from './weightStore'

const BACKFILL_FLAG = 'formplan_backfill_measurements_v1'

/**
 * One-time upload of pre-existing local history (data logged before the
 * server tables existed). The flag is only set when every upload succeeded,
 * so a failed attempt retries on next launch.
 */
async function backfillOnce(): Promise<void> {
  if (localStorage.getItem(BACKFILL_FLAG)) return

  const weights = getWeightEntries()
  const measurements = getMeasurements()
  if (weights.length === 0 && measurements.length === 0) {
    localStorage.setItem(BACKFILL_FLAG, '1')
    return
  }

  try {
    // Skip dates the server already has, so retries never duplicate rows.
    const { measurements: server } = await measurementsApi.list()
    const serverWeightDates = new Set(
      server.filter((m) => typeof m.weight_kg === 'number').map((m) => m.measured_on)
    )
    const serverGirthDates = new Set(
      server.filter((m) => typeof m.weight_kg !== 'number').map((m) => m.measured_on)
    )

    for (const w of weights) {
      if (serverWeightDates.has(w.date)) continue
      await measurementsApi.create({ measured_on: w.date, weight_kg: w.weight_kg })
    }
    for (const m of measurements) {
      if (serverGirthDates.has(m.date)) continue
      const { waist_cm, chest_cm, hips_cm, arm_cm, thigh_cm, weight_kg } = m
      if (![waist_cm, chest_cm, hips_cm, arm_cm, thigh_cm, weight_kg].some((v) => typeof v === 'number')) continue
      await measurementsApi.create({ measured_on: m.date, weight_kg, waist_cm, chest_cm, hips_cm, arm_cm, thigh_cm })
    }
    localStorage.setItem(BACKFILL_FLAG, '1')
  } catch {
    /* offline or table not migrated yet — retry on next launch */
  }
}

/**
 * Backfill once, then pull server rows (from other devices) into the local
 * stores. Call on mount of pages that show weight/measurements; resolves when
 * the merge is done so callers can refresh their state. Never rejects.
 */
export async function initMeasurementsSync(): Promise<void> {
  await backfillOnce()
  try {
    const { measurements } = await measurementsApi.list()
    mergeServerWeights(measurements)
    mergeServerMeasurements(measurements)
  } catch {
    /* offline — local data stands */
  }
}
