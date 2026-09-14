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
// Måste innehålla en riktig träningsdag: en plan helt utan pass är inte en
// giltig plan och normaliseringen kastar på den.
const planJson = JSON.stringify({
  days: [
    {
      weekday: 1,
      type: 'workout',
      content: {
        name: 'Överkropp',
        focus: 'Bröst',
        duration_minutes: 60,
        exercises: [{ exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 }],
      },
      nutrition: { total_calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 60, meals: [] },
    },
    { weekday: 2, type: 'rest', content: { notes: 'vila' }, nutrition: { total_calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 60, meals: [] } },
  ],
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

  // Ett påhittat id fick tidigare gå genom fritextmatchningen FÖRE namnet.
  // "dips" matchar bröstövningen Dips i katalogen, så modellens korrekta
  // "Tricepsdips" byttes tyst ut mot fel övning (och fel namn skrevs).
  it('prefers the model name over a free-text match on a bogus exercise_id', () => {
    const days = normalizePlanExercises([
      workoutDay([
        { exercise_id: 'dips', name: 'Tricepsdips', sets: 3, reps: '12', rest_seconds: 60 },
      ]),
    ])

    const [ex] = exercisesOf(days[0]!)
    expect(ex?.exercise_id).toBe('tricepsdips')
    expect(ex?.name).toBe('Tricepsdips')
  })

  // Id med understreck i stället för bindestreck: namnet är ändå igenkännbart
  // och ska avgöra — den sittande varianten får aldrig bli den stående.
  it('resolves a typo:d exercise_id via the name (seated calf press stays seated)', () => {
    const days = normalizePlanExercises([
      workoutDay([
        {
          exercise_id: 'vadpress_sittande',
          name: 'Sittande vadpress',
          sets: 4,
          reps: '15',
          rest_seconds: 60,
        },
      ]),
    ])

    const [ex] = exercisesOf(days[0]!)
    expect(ex?.exercise_id).toBe('vadpress-sittande')
    expect(ex?.name).toBe('Sittande vadpress')
  })

  // Sista utvägen: namnet saknas helt, men id:t går att tolka.
  it('falls back to matching on the exercise_id when there is no name at all', () => {
    const days = normalizePlanExercises([
      workoutDay([
        { exercise_id: 'vadpress_sittande', name: '', sets: 4, reps: '15', rest_seconds: 60 },
      ]),
    ])

    const [ex] = exercisesOf(days[0]!)
    expect(ex?.exercise_id).toBe('vadpress-sittande')
  })

  // Finns ett namn som inte går att lösa upp är ett trasigt id INGEN ledtråd.
  // Gissningen gav tidigare en annan muskelgrupp — eller en konditionsmaskin —
  // med fel bild och historiken hopslagen med fel lyft.
  it.each([
    ['dips', 'Tricepsdips på bänk'],
    ['rodd', 'Rodd med skivstång, tung'],
    ['rodd', 'Sittande rodd med kabel'],
    ['vadpress', 'Sittande vadpress i maskin'],
  ])('drops %s/%s instead of guessing from the id', (exercise_id, name) => {
    const good = workoutDay([
      { exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 },
    ])
    const risky: GeneratedPlanDay = {
      ...workoutDay([{ exercise_id, name, sets: 3, reps: '10', rest_seconds: 60 }]),
      weekday: 2,
    }
    // Dagen töms och blir vilodag — men ingen övning byts tyst ut mot en annan.
    const days = normalizePlanExercises([good, good, risky])
    expect(days[2]!.type).toBe('rest')
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

  // Modellens `type` får inte avgöra om normaliseringen körs: ett pass som
  // felmärkts (t.ex. "nutrition") skulle annars skriva råa, okanoniserade
  // övningar rakt in i plan_day.content.
  it('normalizes exercises on a day that is mislabelled as another type', () => {
    const mislabelled = {
      ...workoutDay([
        { exercise_id: 'flat-bench-press-barbell', name: 'Bench press', sets: 3, reps: '10', rest_seconds: 90 },
      ]),
      type: 'nutrition',
    } as unknown as GeneratedPlanDay

    const days = normalizePlanExercises([mislabelled])

    expect(exercisesOf(days[0]!)).toEqual([
      { exercise_id: 'bankpress', name: 'Bänkpress', sets: 3, reps: '10', rest_seconds: 90 },
    ])
    // Dagen bär katalogövningar ⇒ den ÄR en träningsdag.
    expect(days[0]!.type).toBe('workout')
  })

  // En trasig dag får inte kasta bort hela veckan: den blir en vilodag
  // (nutritionen behålls) så länge merparten av passen överlevde.
  it('turns a single unusable workout day into a rest day and keeps the rest', () => {
    const good = (weekday: number): GeneratedPlanDay => ({
      ...workoutDay([{ exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 }]),
      weekday,
    })
    const bad: GeneratedPlanDay = {
      ...workoutDay([{ exercise_id: 'trollstavsviftning', name: 'Trollstavsviftning', sets: 3, reps: '12', rest_seconds: 60 }]),
      weekday: 3,
    }

    const days = normalizePlanExercises([good(1), bad, good(5)])

    expect(days).toHaveLength(3)
    expect(days.map((d) => d.type)).toEqual(['workout', 'rest', 'workout'])
    expect(days[1]!.content).toEqual({ notes: 'Vila' })
    // Nutritionen för veckodagen finns kvar.
    expect(days[1]!.nutrition).toBe(nutrition)
    expect(exercisesOf(days[0]!)).toHaveLength(1)
    expect(exercisesOf(days[2]!)).toHaveLength(1)
  })

  it('throws when more than half of the workout days end up empty', () => {
    const good: GeneratedPlanDay = {
      ...workoutDay([{ exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 }]),
      weekday: 1,
    }
    const bad = (weekday: number): GeneratedPlanDay => ({
      ...workoutDay([{ exercise_id: 'trollstavsviftning', name: 'Trollstavsviftning', sets: 3, reps: '12', rest_seconds: 60 }]),
      weekday,
    })

    expect(() => normalizePlanExercises([good, bad(3), bad(5)])).toThrow(/no exercises/i)
  })

  it('leaves rest days untouched', () => {
    const restDay: GeneratedPlanDay = {
      weekday: 3,
      type: 'rest',
      content: { notes: 'Vila' },
      nutrition,
    }
    const workout = workoutDay([
      { exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 },
    ])
    const days = normalizePlanExercises([workout, restDay])
    expect(days[1]!.content).toEqual({ notes: 'Vila' })
  })

  // En plan helt utan träningsdagar är ingen träningsplan. Den slank tidigare
  // igenom och markerades "ready" — klienten visade "inget schema" medan API:t
  // sa klart, och genereringen är hårt kvotad.
  it('throws when the response contains no workout day at all', () => {
    const restDay: GeneratedPlanDay = { weekday: 3, type: 'rest', content: { notes: 'Vila' }, nutrition }
    expect(() => normalizePlanExercises([restDay])).toThrow(/no exercises/i)
  })

  // Exakt hälften räckte tidigare: den som bad om 4 träningsdagar fick tyst 2.
  it('throws when only half of the workout days survive', () => {
    const good = (weekday: number): GeneratedPlanDay => ({
      ...workoutDay([{ exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 }]),
      weekday,
    })
    const bad = (weekday: number): GeneratedPlanDay => ({
      ...workoutDay([{ exercise_id: 'trollstav', name: 'Trollstavsviftning', sets: 3, reps: '12', rest_seconds: 60 }]),
      weekday,
    })
    expect(() => normalizePlanExercises([good(1), good(2), bad(3), bad(4)])).toThrow(/no exercises/i)
  })

  // Ett pass felmärkt som "nutrition" bär nutrition-innehåll. Spridningen gav
  // en workout-rad utan name/duration_minutes → tom rubrik och "undefined min".
  it('rebuilds workout content when the day was mislabelled as nutrition', () => {
    const mislabelled = {
      weekday: 1,
      type: 'nutrition',
      content: {
        total_calories: 2200,
        meals: [{ name: 'Frukost' }],
        exercises: [{ exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 }],
      },
      nutrition,
    } as unknown as GeneratedPlanDay

    const days = normalizePlanExercises([mislabelled])
    expect(days[0]!.type).toBe('workout')
    const content = days[0]!.content as WorkoutDay & { total_calories?: number }
    expect(content.name).toBe('Pass')
    expect(typeof content.duration_minutes).toBe('number')
    expect(content.total_calories).toBeUndefined()
  })

  // Två rader med samma (plan_id, weekday, type) spränger unik-indexet: hela
  // insert:en fallerar och planen sparas som "error".
  it('stores a type outside the schema as a rest day (no nutrition row collision)', () => {
    const workout = workoutDay([
      { exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 },
    ])
    const nutritionDay = {
      weekday: 2,
      type: 'nutrition',
      content: { meals: [] },
      nutrition,
    } as unknown as GeneratedPlanDay

    const days = normalizePlanExercises([workout, nutritionDay])
    expect(days[1]!.type).toBe('rest')
    expect(days[1]!.content).toEqual({ notes: 'Vila' })
  })

  // En vilodag som bär en TOM exercises-array är fortfarande bara en vilodag —
  // den får inte räknas som en misslyckad träningsdag och sänka hela planen.
  it('does not count rest days with an empty exercises array as failed workouts', () => {
    const restWithEmptyArray = {
      weekday: 2,
      type: 'rest',
      content: { notes: 'Vila', exercises: [] },
      nutrition,
    } as unknown as GeneratedPlanDay
    const good: GeneratedPlanDay = {
      ...workoutDay([{ exercise_id: 'bankpress', name: 'Bänkpress', sets: 4, reps: '8', rest_seconds: 120 }]),
      weekday: 1,
    }

    const days = normalizePlanExercises([good, restWithEmptyArray, { ...restWithEmptyArray, weekday: 4 }])
    expect(days.map((d) => d.type)).toEqual(['workout', 'rest', 'rest'])
    expect(exercisesOf(days[0]!)).toHaveLength(1)
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
