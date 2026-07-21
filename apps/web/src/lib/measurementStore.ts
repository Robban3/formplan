import { measurementsApi, type ServerMeasurement } from './measurementsApi'

export interface BodyMeasurement {
  id: string
  date: string        // YYYY-MM-DD
  weight_kg?: number
  waist_cm?: number
  chest_cm?: number
  hips_cm?: number
  arm_cm?: number
  thigh_cm?: number
}

const KEY = 'formplan_measurements'

function load(): BodyMeasurement[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as BodyMeasurement[] }
  catch { return [] }
}
function save(data: BodyMeasurement[]) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getMeasurements(): BodyMeasurement[] {
  return load().sort((a, b) => a.date.localeCompare(b.date))
}

export function addMeasurement(m: Omit<BodyMeasurement, 'id'>): BodyMeasurement {
  const all = load()
  const entry: BodyMeasurement = { ...m, id: crypto.randomUUID() }
  // Replace existing entry for same date
  save([...all.filter((x) => x.date !== m.date), entry])
  // Best-effort server mirror — the local UX must never depend on it.
  const { date, ...fields } = m
  measurementsApi.create({ measured_on: date, ...fields }).catch(() => {})
  return entry
}

export function deleteMeasurement(id: string) {
  save(load().filter((e) => e.id !== id))
}

/**
 * Merge server measurement rows (girths logged on other devices) into the
 * local store. Only dates missing locally are added, nothing is overwritten.
 */
export function mergeServerMeasurements(rows: ServerMeasurement[]) {
  const local = load()
  const have = new Set(local.map((e) => e.date))
  const added: BodyMeasurement[] = []
  for (const m of rows) {
    const girths = [m.waist_cm, m.chest_cm, m.hips_cm, m.arm_cm, m.thigh_cm]
    if (!girths.some((v) => typeof v === 'number') || have.has(m.measured_on)) continue
    have.add(m.measured_on)
    added.push({
      id: m.id,
      date: m.measured_on,
      weight_kg: m.weight_kg ?? undefined,
      waist_cm: m.waist_cm ?? undefined,
      chest_cm: m.chest_cm ?? undefined,
      hips_cm: m.hips_cm ?? undefined,
      arm_cm: m.arm_cm ?? undefined,
      thigh_cm: m.thigh_cm ?? undefined,
    })
  }
  if (added.length > 0) save([...local, ...added])
}
