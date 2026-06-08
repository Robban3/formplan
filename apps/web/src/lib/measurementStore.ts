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
  return entry
}

export function deleteMeasurement(id: string) {
  save(load().filter((e) => e.id !== id))
}
