import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL as string

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export interface FoodItem {
  id: string
  name: string
  kcal_per_100g: number
  protein_per_100g: number
  fat_per_100g: number
  carbs_per_100g: number
  serving_size_g?: number
}

export interface FoodLogEntry {
  id: string
  date: string         // YYYY-MM-DD
  meal_slot: MealSlot
  food_id: string
  food_name: string
  amount_g: number
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

export type MealSlot = 'frukost' | 'lunch' | 'middag' | 'mellanmar'

export interface DailyGoals {
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

export interface WaterEntry {
  id: string
  date: string
  amount_ml: number
  logged_at: string
}

export const nutritionApi = {
  searchFoods: (q: string) =>
    request<{ items: FoodItem[] }>(`/nutrition/foods/search?q=${encodeURIComponent(q)}`),

  getDailyLog: (date: string) =>
    request<{ entries: FoodLogEntry[]; goals: DailyGoals }>(`/nutrition/log?date=${date}`),

  addLogEntry: (entry: Omit<FoodLogEntry, 'id'>) =>
    request<{ entry: FoodLogEntry }>('/nutrition/log', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  deleteLogEntry: (id: string) =>
    request<void>(`/nutrition/log/${id}`, { method: 'DELETE' }),

  getWater: (date: string) =>
    request<{ entries: WaterEntry[]; total_ml: number }>(`/nutrition/water?date=${date}`),

  addWater: (date: string, amount_ml: number) =>
    request<{ entry: WaterEntry }>('/nutrition/water', {
      method: 'POST',
      body: JSON.stringify({ date, amount_ml }),
    }),

  deleteWater: (id: string) =>
    request<void>(`/nutrition/water/${id}`, { method: 'DELETE' }),
}
