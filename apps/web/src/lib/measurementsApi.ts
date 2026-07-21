import { request } from './api'

export interface ServerMeasurement {
  id: string
  measured_on: string // YYYY-MM-DD
  weight_kg: number | null
  waist_cm: number | null
  chest_cm: number | null
  hips_cm: number | null
  arm_cm: number | null
  thigh_cm: number | null
  created_at: string
}

export interface MeasurementInput {
  measured_on: string
  weight_kg?: number
  waist_cm?: number
  chest_cm?: number
  hips_cm?: number
  arm_cm?: number
  thigh_cm?: number
}

export const measurementsApi = {
  list: () => request<{ measurements: ServerMeasurement[] }>('/measurements'),

  create: (m: MeasurementInput) =>
    request<{ measurement: ServerMeasurement }>('/measurements', {
      method: 'POST',
      body: JSON.stringify(m),
    }),

  remove: (id: string) => request<{ ok: true }>(`/measurements/${id}`, { method: 'DELETE' }),
}
