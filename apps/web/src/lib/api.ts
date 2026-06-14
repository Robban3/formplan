import { supabase } from './supabase'
import { toast } from './toast'
import { getMockPlanResponse, parseMockPlanId, type MockGoal } from './mockPlan'

const BASE = import.meta.env.VITE_API_URL as string

export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string; code?: string }
    const message = err.error ?? res.statusText
    // Premium-gate (402): visa en toast centralt så alla AI-funktioner ger
    // samma tydliga "uppgradera"-meddelande oavsett lokal felhantering.
    if (res.status === 402) toast.error(message)
    throw new ApiError(message, res.status, err.code)
  }
  return res.json() as Promise<T>
}

export interface PlanSummary {
  id: string
  status: 'generating' | 'ready' | 'error'
  created_at: string
}

export interface GeneratedRecipe {
  name: string
  meal_type: string
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  prep_minutes: number
  servings: number
  ingredients: string[]
  steps: string[]
  tags: string[]
}

export type RecipeCategory = 'kott' | 'fisk' | 'pasta' | 'vegetariskt' | 'veganskt'

export interface RecipeRequest {
  prompt: string
  calorie_target?: number | null
  min_protein_g?: number | null
  allergies?: string[]
  meal_type?: string | null
  category?: RecipeCategory | null
}

export interface FoodPhotoItem {
  name: string
  amount_g: number
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

export interface FoodPhotoAnalysis {
  description: string
  items: FoodPhotoItem[]
  total: { kcal: number; protein_g: number; fat_g: number; carbs_g: number }
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

  generateRecipe: (body: RecipeRequest) =>
    request<{ recipe: GeneratedRecipe }>('/ai/recipe', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  analyzeFoodPhoto: (image: string, media_type: 'image/jpeg' | 'image/png' | 'image/webp') =>
    request<{ analysis: FoodPhotoAnalysis }>('/ai/food-photo', {
      method: 'POST',
      body: JSON.stringify({ image, media_type }),
    }),
}

// Shared request helper for sibling API clients.
export { request }
