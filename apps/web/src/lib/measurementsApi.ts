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
  /** Klientens lokala post-id, satt när raden kom via offline-flushen. */
  client_id?: string | null
}

export interface MeasurementInput {
  measured_on: string
  weight_kg?: number
  waist_cm?: number
  chest_cm?: number
  hips_cm?: number
  arm_cm?: number
  thigh_cm?: number
  /**
   * Klientens lokala post-id. Skickas av offline-flushen så en re-POST efter
   * ett förlorat svar blir en no-op i stället för en dubblettrad.
   */
  client_id?: string
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
