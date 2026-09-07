import { describe, it, expect, vi, afterEach } from 'vitest'
import { generatePlan, normalizePlanExercises, type GeneratedPlanDay } from './ai'
import type { Env, FitnessProfile, WorkoutDay } from './types'

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

// Modellen får aldrig litas på: den kan hitta på id:n, stava namn på eget sätt
// eller utelämna exercise_id. normalizePlanExercises låser övningarna till den
// kurerade katalogen så bild/teknik alltid kan kopplas och historiken inte
// splittras på namnvarianter.
describe('normalizePlanExercises', () => {
  const nutrition = { total_calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 60, meals: [] }

  const workoutDay = (exercises: unknown[]): GeneratedPlanDay => ({
    weekday: 1,
    type: 'workout',
    content: { name: 'Pass', focus: 'Bröst', duration_minutes: 60, exercises } as unknown as WorkoutDay,
    nutrition,
  })

  const exercisesOf = (day: GeneratedPlanDay) => (day.content as WorkoutDay).exercises

  it('keeps a valid exercise_id and canonicalises the name', () => {
    const days = normalizePlanExercises([
      workoutDay([
        // Modellens namnvariant ska skrivas över med katalogens namn.
        { exercise_id: 'bankpress', name: 'Bänkpress med skivstång', sets: 4, reps: '8', rest_seconds: 120 },
      ]),
    ])

    expect(exercisesOf(days[0]!)).toEqual([
      { exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 },
    ])
  })

  it('repairs an unknown exercise_id when the name is recognisable', () => {
    const days = normalizePlanExercises([
      workoutDay([
        { exercise_id: 'flat-bench-press-barbell', name: 'Bench press', sets: 3, reps: '10', rest_seconds: 90 },
      ]),
    ])

    const [ex] = exercisesOf(days[0]!)
    expect(ex?.exercise_id).toBe('bankpress')
    expect(ex?.name).toBe('Bänkpress')
  })

  it('drops an exercise that cannot be resolved at all', () => {
    const days = normalizePlanExercises([
      workoutDay([
        { exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 },
        { exercise_id: 'trollstavsviftning', name: 'Trollstavsviftning', sets: 3, reps: '12', rest_seconds: 60 },
      ]),
    ])

    expect(exercisesOf(days[0]!).map((e) => e.exercise_id)).toEqual(['bankpress'])
  })

  it('throws when a workout day is left without any valid exercise', () => {
    expect(() =>
      normalizePlanExercises([
        workoutDay([{ exercise_id: 'trollstavsviftning', name: 'Trollstavsviftning', sets: 3, reps: '12', rest_seconds: 60 }]),
      ])
    ).toThrow(/no exercises/i)
  })

  it('leaves rest days untouched', () => {
    const restDay: GeneratedPlanDay = {
      weekday: 3,
      type: 'rest',
      content: { notes: 'Vila' },
      nutrition,
    }
    const days = normalizePlanExercises([restDay])
    expect(days[0]!.content).toEqual({ notes: 'Vila' })
  })
})

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

  // Övningarna sparas i plan_day.content (jsonb) — exercise_id måste faktiskt
  // följa med dit, annars går det fortfarande inte att koppla bild/teknik.
  it('writes catalog exercise_id into the stored plan_day content', async () => {
    const withWorkout = JSON.stringify({
      days: [
        {
          weekday: 1,
          type: 'workout',
          content: {
            name: 'Bröst',
            focus: 'Tryck',
            duration_minutes: 60,
            // Modellen svarar utan exercise_id och med en egen namnvariant.
            exercises: [{ name: 'Bänkpress med skivstång', sets: 4, reps: '8', rest_seconds: 120 }],
          },
          nutrition: { total_calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 60, meals: [] },
        },
      ],
    })

    let posted: unknown[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('generativelanguage.googleapis.com')) {
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: withWorkout }] }, finishReason: 'STOP' }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      if (url.includes('/plan_day') && init?.method === 'POST') {
        posted = JSON.parse(String(init.body)) as unknown[]
        return new Response('', { status: 201 })
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    await generatePlan('plan-1', profile, env)

    const workoutRow = posted.find((r) => (r as { type: string }).type === 'workout') as {
      content: { exercises: { exercise_id?: string; name: string }[] }
    }
    expect(workoutRow.content.exercises).toEqual([
      { exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 },
    ])
  })
})
