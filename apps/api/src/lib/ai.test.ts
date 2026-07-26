import { describe, it, expect, vi, afterEach } from 'vitest'
import { generatePlan } from './ai'
import type { Env, FitnessProfile } from './types'

// generatePlan körs i bakgrunden (waitUntil). Om plan_day-insert misslyckas får
// den ALDRIG markera planen "ready" (tyst tomt schema) — den ska i stället kasta
// så routes/plan.ts:s yttre .catch sätter status "error". db.query kastar aldrig
// (returnerar { error }), så utan en explicit koll skulle buggen slinka igenom.

// Kör mot Gemini (rå fetch → mockbar) i stället för Anthropic-SDK:n.
const env = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  ANTHROPIC_API_KEY: 'test-key',
  AI_PROVIDER: 'gemini',
  GEMINI_API_KEY: 'test-gemini-key',
  STRIPE_SECRET_KEY: 'test-key',
  STRIPE_WEBHOOK_SECRET: 'test-secret',
  RESEND_API_KEY: 'test-key',
  WEBHOOK_SECRET: 'test-secret',
  ENVIRONMENT: 'test',
} as unknown as Env

const profile: FitnessProfile = {
  user_id: 'user-1',
  goal: 'maintain',
  level: 'beginner',
  equipment: ['bodyweight'],
  days_per_week: 3,
  allergies: [],
  calorie_goal: null,
  age: null,
  weight_kg: null,
  height_cm: null,
  updated_at: '2026-01-01T00:00:00Z',
}

// Ett minimalt men giltigt plan-JSON-svar från modellen.
const planJson = JSON.stringify({
  days: [{ weekday: 1, type: 'rest', content: { notes: 'vila' }, nutrition: { total_calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 60, meals: [] } }],
})

const geminiOk = () =>
  new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text: planJson }] }, finishReason: 'STOP' }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )

describe('generatePlan plan_day insert failure', () => {
  afterEach(() => vi.restoreAllMocks())

  it('throws (does not mark ready) when the plan_day insert returns an error', async () => {
    let patchedReady = false
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('generativelanguage.googleapis.com')) return geminiOk()
      if (url.includes('/plan_day') && init?.method === 'POST') {
        // Insert misslyckas.
        return new Response('insert failed', { status: 500 })
      }
      if (url.includes('/plan?id=eq.') && init?.method === 'PATCH') {
        const body = JSON.parse(String(init.body)) as { status?: string }
        if (body.status === 'ready') patchedReady = true
        return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    await expect(generatePlan('plan-1', profile, env)).rejects.toThrow()
    // Kritiskt: planen får INTE ha markerats "ready".
    expect(patchedReady).toBe(false)
  })

  it('marks ready when the plan_day insert succeeds', async () => {
    let patchedReady = false
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('generativelanguage.googleapis.com')) return geminiOk()
      if (url.includes('/plan_day') && init?.method === 'POST') {
        return new Response('', { status: 201 })
      }
      if (url.includes('/plan?id=eq.') && init?.method === 'PATCH') {
        const body = JSON.parse(String(init.body)) as { status?: string }
        if (body.status === 'ready') patchedReady = true
        return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    await expect(generatePlan('plan-1', profile, env)).resolves.toBeUndefined()
    expect(patchedReady).toBe(true)
  })
})
