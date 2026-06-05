import { supabase } from './supabase'
import { getMockPlanResponse, parseMockPlanId, type MockGoal } from './mockPlan'

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

  /** Skapar ett färdigt schema med mockdata i databasen (ingen AI). */
  generateMockPlan: (goal?: MockGoal) =>
    request<{ plan_id: string; status: string }>('/plan/mock', {
      method: 'POST',
      body: JSON.stringify(goal ? { goal } : {}),
    }),

  getPlan: async (id: string) => {
    const mockGoal = parseMockPlanId(id)
    if (mockGoal) {
      return getMockPlanResponse(id, mockGoal)
    }
    if (import.meta.env.VITE_USE_MOCK_PLAN === 'true') {
      return getMockPlanResponse(id)
    }
    return request<{ plan: unknown; days: unknown[] }>(`/plan/${id}`)
  },

  listPlans: () => request<{ plans: PlanSummary[] }>('/plan/list'),
}

// Shared request helper for sibling API clients.
export { request }
