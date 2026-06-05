import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL as string

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export interface PlanSummary {
  id: string
  status: 'generating' | 'ready' | 'error'
  created_at: string
}

export const api = {
  getProfile: () => request<{ profile: unknown }>('/profile'),

  saveProfile: (data: unknown) =>
    request<{ profile: unknown }>('/profile', { method: 'POST', body: JSON.stringify(data) }),

  generatePlan: () =>
    request<{ plan_id: string; status: string }>('/plan/generate', { method: 'POST', body: '{}' }),

  getPlan: (id: string) => request<{ plan: unknown; days: unknown[] }>(`/plan/${id}`),

  listPlans: () => request<{ plans: PlanSummary[] }>('/plan/list'),
}

// Shared request helper for sibling API clients.
export { request }
