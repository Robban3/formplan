/** Client-side mock — fullständigt schema utan API. Id-format: mock-{goal} */

export type MockGoal = 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_endurance'

export const MOCK_GOALS: MockGoal[] = ['lose_weight', 'build_muscle', 'maintain', 'improve_endurance']

export const MOCK_PLAN_ID = 'mock-maintain'

export function mockPlanId(goal: MockGoal): string {
  return `mock-${goal}`
}

export function parseMockPlanId(id: string): MockGoal | null {
  if (!id.startsWith('mock-')) return null
  const goal = id.slice(5) as MockGoal
  return MOCK_GOALS.includes(goal) ? goal : null
}

interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  notes?: string
}

interface WorkoutContent {
  name: string
  focus: string
  duration_minutes: number
  exercises: Exercise[]
}

interface Meal {
  name: string
  time: string
  calories: number
  items: string[]
}

interface NutritionContent {
  total_calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  meals: Meal[]
}

export interface MockPlanDay {
  id: string
  weekday: number
  type: 'workout' | 'nutrition' | 'rest'
  content: WorkoutContent | NutritionContent | { notes: string }
}

export interface MockPlanResponse {
  plan: { id: string; status: 'ready'; created_at: string }
  days: MockPlanDay[]
}

interface GoalTemplate {
  workoutDays: number[]
  workouts: Record<number, WorkoutContent | { notes: string }>
  nutrition: Record<number, NutritionContent>
}

function buildGoalTemplates(): Record<MockGoal, GoalTemplate> {
  return {
  lose_weight: {
    workoutDays: [1, 2, 4, 5],
    workouts: {
      1: {
        name: 'Helkropp & fettförbränning',
        focus: 'Circuit, hög puls',
        duration_minutes: 45,
        exercises: [
          { name: 'Burpees', sets: 4, reps: '12', rest_seconds: 45 },
          { name: 'Kettlebell swings', sets: 4, reps: '20', rest_seconds: 45 },
          { name: 'Goblet squat', sets: 3, reps: '15', rest_seconds: 60 },
          { name: 'Mountain climbers', sets: 3, reps: '40 s', rest_seconds: 30 },
          { name: 'Plankan', sets: 3, reps: '45 s', rest_seconds: 30 },
        ],
      },
      2: {
        name: 'Kondition & core',
        focus: 'Löpband, intervaller',
        duration_minutes: 40,
        exercises: [
          { name: 'Löpintervaller', sets: 6, reps: '1 min hårt / 1 min lätt', rest_seconds: 0, notes: 'På löpband eller utomhus' },
          { name: 'Russian twist', sets: 3, reps: '20', rest_seconds: 45 },
          { name: 'Bicycle crunch', sets: 3, reps: '20/sida', rest_seconds: 45 },
          { name: 'Dead bug', sets: 3, reps: '12/sida', rest_seconds: 45 },
        ],
      },
      3: { notes: 'Vila — promenad 45–60 min i måttlig takt.' },
      4: {
        name: 'Styrka helkropp',
        focus: 'Muskler bibehålls under deficit',
        duration_minutes: 50,
        exercises: [
          { name: 'Knäböj med hantlar', sets: 4, reps: '12', rest_seconds: 75 },
          { name: 'Hantelrodd', sets: 3, reps: '12', rest_seconds: 75 },
          { name: 'Hantelpress', sets: 3, reps: '12', rest_seconds: 75 },
          { name: 'Utfallsgång', sets: 3, reps: '12/ben', rest_seconds: 60 },
        ],
      },
      5: {
        name: 'Aktiv återhämtning',
        focus: 'Lätt rörelse, låg intensitet',
        duration_minutes: 35,
        exercises: [
          { name: 'Promenad eller cykel', sets: 1, reps: '30 min', rest_seconds: 0 },
          { name: 'Mobilitet höfter & axlar', sets: 1, reps: '10 min', rest_seconds: 0 },
          { name: 'Stretch', sets: 1, reps: '10 min', rest_seconds: 0 },
        ],
      },
      6: { notes: 'Vila. Fokus på sömn och återhämtning.' },
      7: { notes: 'Vila. Planera måltider för veckan.' },
    },
    nutrition: buildWeekNutrition(1950, 155, 180, 60, [1, 2, 4, 5]),
  },
  build_muscle: {
    workoutDays: [1, 2, 4, 5],
    workouts: {
      1: {
        name: 'Bröst & triceps',
        focus: 'Tryckrörelser, hypertrofi',
        duration_minutes: 60,
        exercises: [
          { name: 'Bänkpress', sets: 4, reps: '6–8', rest_seconds: 120 },
          { name: 'Sned bänkpress', sets: 3, reps: '8–10', rest_seconds: 90 },
          { name: 'Axelpress', sets: 3, reps: '10', rest_seconds: 90 },
          { name: 'Triceps dips', sets: 3, reps: '10–12', rest_seconds: 75 },
          { name: 'Triceps pushdown', sets: 3, reps: '12–15', rest_seconds: 60 },
        ],
      },
      2: {
        name: 'Ben & rumpa',
        focus: 'Quads, glutes, hamstrings',
        duration_minutes: 65,
        exercises: [
          { name: 'Knäböj', sets: 4, reps: '6–8', rest_seconds: 150 },
          { name: 'Rumänsk marklyft', sets: 4, reps: '8–10', rest_seconds: 120 },
          { name: 'Benpress', sets: 3, reps: '10–12', rest_seconds: 90 },
          { name: 'Hip thrust', sets: 3, reps: '12', rest_seconds: 75 },
          { name: 'Vadpress', sets: 4, reps: '15', rest_seconds: 60 },
        ],
      },
      3: { notes: 'Vila eller lätt promenad.' },
      4: {
        name: 'Rygg & biceps',
        focus: 'Dragrörelser, tjocklek',
        duration_minutes: 60,
        exercises: [
          { name: 'Marklyft', sets: 4, reps: '5', rest_seconds: 150, notes: 'Tungt, kontrollerat' },
          { name: 'Lat pulldown', sets: 4, reps: '8–10', rest_seconds: 90 },
          { name: 'Enarms hantelrodd', sets: 3, reps: '10/arm', rest_seconds: 75 },
          { name: 'Hantelcurl', sets: 3, reps: '10–12', rest_seconds: 60 },
          { name: 'Face pull', sets: 3, reps: '15', rest_seconds: 60 },
        ],
      },
      5: {
        name: 'Axlar & armar',
        focus: 'Volym, pump',
        duration_minutes: 50,
        exercises: [
          { name: 'Arnold press', sets: 3, reps: '10', rest_seconds: 75 },
          { name: 'Lateral raises', sets: 4, reps: '15', rest_seconds: 60 },
          { name: 'Hammer curl', sets: 3, reps: '12', rest_seconds: 60 },
          { name: 'Skull crushers', sets: 3, reps: '12', rest_seconds: 60 },
        ],
      },
      6: { notes: 'Aktiv vila — stretching 20 min.' },
      7: { notes: 'Vila. Meal prep inför veckan.' },
    },
    nutrition: buildWeekNutrition(2800, 190, 300, 85, [1, 2, 4, 5]),
  },
  maintain: {
    workoutDays: [1, 3, 5],
    workouts: {
      1: {
        name: 'Helkropp balans',
        focus: 'Styrka & rörlighet',
        duration_minutes: 50,
        exercises: [
          { name: 'Goblet squat', sets: 3, reps: '12', rest_seconds: 75 },
          { name: 'Hantelrodd', sets: 3, reps: '12', rest_seconds: 75 },
          { name: 'Hantelpress', sets: 3, reps: '12', rest_seconds: 75 },
          { name: 'Plankan', sets: 3, reps: '45 s', rest_seconds: 45 },
        ],
      },
      2: { notes: 'Vila eller yoga 30 min.' },
      3: {
        name: 'Kondition medel',
        focus: 'Hjärta & uthållighet',
        duration_minutes: 40,
        exercises: [
          { name: 'Cykling eller rodd', sets: 1, reps: '25 min', rest_seconds: 0, notes: 'Stadig puls, zon 2' },
          { name: 'Utfallsgång', sets: 3, reps: '12/ben', rest_seconds: 60 },
          { name: 'Push-ups', sets: 3, reps: 'max', rest_seconds: 60 },
        ],
      },
      4: { notes: 'Vila — promenad i naturen.' },
      5: {
        name: 'Funktionell styrka',
        focus: 'Vardagsrörelser',
        duration_minutes: 45,
        exercises: [
          { name: 'Kettlebell swings', sets: 4, reps: '15', rest_seconds: 60 },
          { name: 'Farmer walk', sets: 3, reps: '40 m', rest_seconds: 60 },
          { name: 'Step-ups', sets: 3, reps: '12/ben', rest_seconds: 60 },
          { name: 'Bird dog', sets: 3, reps: '10/sida', rest_seconds: 45 },
        ],
      },
      6: { notes: 'Aktiv vila.' },
      7: { notes: 'Vila. Njut av helgen.' },
    },
    nutrition: buildWeekNutrition(2300, 150, 250, 75, [1, 3, 5]),
  },
  improve_endurance: {
    workoutDays: [1, 2, 4, 5, 6],
    workouts: {
      1: {
        name: 'Intervallpass',
        focus: 'VO2 max, snabbhet',
        duration_minutes: 45,
        exercises: [
          { name: 'Uppvärmning', sets: 1, reps: '10 min lätt', rest_seconds: 0 },
          { name: 'Intervaller', sets: 8, reps: '400 m hårt', rest_seconds: 90, notes: 'Löpning eller roddmaskin' },
          { name: 'Nedvarvning', sets: 1, reps: '5 min', rest_seconds: 0 },
        ],
      },
      2: {
        name: 'Tempolöpning',
        focus: 'Laktattröskel',
        duration_minutes: 50,
        exercises: [
          { name: 'Tempo', sets: 1, reps: '25–30 min', rest_seconds: 0, notes: 'Utmanande men hållbar takt' },
          { name: 'Core-circuit', sets: 3, reps: 'runda', rest_seconds: 60, notes: 'Planka, dead bug, side plank' },
        ],
      },
      3: { notes: 'Vila eller lätt cykling 30 min.' },
      4: {
        name: 'Långpass',
        focus: 'Aerob bas, uthållighet',
        duration_minutes: 60,
        exercises: [
          { name: 'Långlöpning/cykling', sets: 1, reps: '45–60 min', rest_seconds: 0, notes: 'Låg intensitet, zon 2' },
        ],
      },
      5: {
        name: 'Styrka underhåll',
        focus: 'Benstyrka utan trötthet',
        duration_minutes: 40,
        exercises: [
          { name: 'Utfallsgång', sets: 3, reps: '12/ben', rest_seconds: 60 },
          { name: 'Enbens Romanian deadlift', sets: 3, reps: '10/ben', rest_seconds: 60 },
          { name: 'Calf raises', sets: 3, reps: '15', rest_seconds: 45 },
          { name: 'Plankan', sets: 3, reps: '45 s', rest_seconds: 45 },
        ],
      },
      6: {
        name: 'Fartlek',
        focus: 'Lekfull variation i tempo',
        duration_minutes: 40,
        exercises: [
          { name: 'Fartlek', sets: 1, reps: '30 min', rest_seconds: 0, notes: 'Växla mellan snabbt och lugnt' },
        ],
      },
      7: { notes: 'Vila. Stretch och foam rolling.' },
    },
    nutrition: buildWeekNutrition(2450, 140, 310, 70, [1, 2, 4, 5, 6]),
  },
  }
}

export function getMockPlanResponse(planId: string, goal: MockGoal = 'maintain'): MockPlanResponse {
  const template = GOAL_TEMPLATES[goal]
  const workoutSet = new Set(template.workoutDays)
  const days: MockPlanDay[] = []

  for (let weekday = 1; weekday <= 7; weekday++) {
    const isWorkout = workoutSet.has(weekday)
    days.push({
      id: `${planId}-d${weekday}-${isWorkout ? 'workout' : 'rest'}`,
      weekday,
      type: isWorkout ? 'workout' : 'rest',
      content: template.workouts[weekday]!,
    })
    days.push({
      id: `${planId}-d${weekday}-nutrition`,
      weekday,
      type: 'nutrition',
      content: template.nutrition[weekday]!,
    })
  }

  return {
    plan: { id: planId, status: 'ready', created_at: new Date().toISOString() },
    days,
  }
}

/** Unika måltider per veckodag (1=mån … 7=sön). */
const WEEKDAY_MENUS: Record<
  number,
  {
    frukost: string[]
    lunch: string[]
    middag: string[]
    kvall: string[]
    preworkout?: string[]
  }
> = {
  1: {
    frukost: ['Havregryn med blåbär', 'Kokt ägg 2 st', 'Kaffe'],
    lunch: ['Kycklingfilé 150 g', 'Jasminris 80 g', 'Wokgrönsaker', 'Sojasås'],
    middag: ['Ugnsbakad lax 160 g', 'Rosmarink potatis', 'Ruccolasallad', 'Citron'],
    kvall: ['Kvarg naturell 200 g', 'Mandel 10 g', 'Päron'],
    preworkout: ['Banan', 'Kvarg 150 g'],
  },
  2: {
    frukost: ['Skyr med honung', 'Havregryn 40 g', 'Kanel'],
    lunch: ['Tonfisk i vatten', 'Fullkornsbröd 2 skivor', 'Avokado', 'Tomat'],
    middag: ['Köttfärssås (nötfärs 10%)', 'Fullkornspasta 80 g', 'Riven parmesan', 'Basilika'],
    kvall: ['Cottage cheese', 'Valnötter 12 g', 'Blåbär'],
    preworkout: ['Riswafers 2 st', 'Jordnötssmör 1 msk'],
  },
  3: {
    frukost: ['Äggröra 3 ägg', 'Rågbröd', 'Smör', 'Te'],
    lunch: ['Falukorv stekt', 'Stuvad potatis', 'Inlagd gurka', 'Senap'],
    middag: ['Ugnskyckling lår', 'Bulgur', 'Tzatziki', 'Gurksallad'],
    kvall: ['Filmjölk', 'Musli', 'Russin'],
  },
  4: {
    frukost: ['Smoothie: banan, bär, mjölk', 'Havrefras 30 g'],
    lunch: ['Räksallad', 'Fullkornsknäcke', 'Dill', 'Citron'],
    middag: ['Biffstrimlor 140 g', 'Sötpotatis', 'Haricots verts', 'Vitlökssmör'],
    kvall: ['Proteinpudding', 'Jordgubbar', 'Kakao'],
    preworkout: ['Äppelmos', 'Rostade hasselnötter 10 g'],
  },
  5: {
    frukost: ['Pannkakor 2 st (fullkorn)', 'Lingonsylt', 'Kaffe'],
    lunch: ['Quinoasallad', 'Fetaost', 'Olivolja', 'Kikärtor'],
    middag: ['Torsk i ugn', 'Kokt potatis', 'Ärter', 'Remouladsås'],
    kvall: ['Keso', 'Nötter 15 g', 'Mango'],
    preworkout: ['Dadlar 2 st', 'Salt'],
  },
  6: {
    frukost: ['Yoghurt grekisk', 'Granola', 'Passionsfrukt'],
    lunch: ['Västerbottenspaj (1 bit)', 'Sallad', 'Rödbetor'],
    middag: ['Linsgryta', 'Naanbröd', 'Koriander', 'Yoghurt'],
    kvall: ['Rågknäcke med leverpastej', 'Gurkskivor'],
  },
  7: {
    frukost: ['Ägg Benedict (1 portion)', 'Spenat', 'Hollandaise'],
    lunch: ['Grillad halloumi', 'Couscous', 'Paprika', 'Rödlök'],
    middag: ['Helstekt kyckling', 'Rostade rotfrukter', 'Timjan'],
    kvall: ['Glass 1 kula', 'Bär', 'Mint'],
  },
}

function buildWeekNutrition(
  trainKcal: number,
  trainProtein: number,
  trainCarbs: number,
  trainFat: number,
  workoutDays: number[]
): Record<number, NutritionContent> {
  const workoutSet = new Set(workoutDays)
  const restKcal = Math.round(trainKcal * 0.88)
  const restProtein = Math.round(trainProtein * 0.92)
  const restCarbs = Math.round(trainCarbs * 0.85)
  const restFat = Math.round(trainFat * 0.95)
  const out: Record<number, NutritionContent> = {}

  for (let d = 1; d <= 7; d++) {
    const isTrain = workoutSet.has(d)
    out[d] = dayNutrition(
      isTrain ? trainKcal : restKcal,
      isTrain ? trainProtein : restProtein,
      isTrain ? trainCarbs : restCarbs,
      isTrain ? trainFat : restFat,
      isTrain,
      d
    )
  }
  return out
}

function dayNutrition(
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  isTrain: boolean,
  weekday: number
): NutritionContent {
  const menu = WEEKDAY_MENUS[weekday]!
  const preWorkout = isTrain && menu.preworkout
    ? [{ name: 'Pre-workout', time: '16:00', calories: 180, items: menu.preworkout }]
    : []

  return {
    total_calories: kcal,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    meals: [
      { name: 'Frukost', time: '07:30', calories: Math.round(kcal * 0.22), items: menu.frukost },
      { name: 'Lunch', time: '12:00', calories: Math.round(kcal * 0.28), items: menu.lunch },
      ...preWorkout,
      { name: 'Middag', time: '18:30', calories: Math.round(kcal * 0.32), items: menu.middag },
      { name: 'Kvällsmål', time: '21:00', calories: Math.round(kcal * 0.12), items: menu.kvall },
    ],
  }
}

const GOAL_TEMPLATES = buildGoalTemplates()

export function goalFromProfile(profile: unknown): MockGoal {
  const goal = (profile as { goal?: string } | null)?.goal
  return goal && MOCK_GOALS.includes(goal as MockGoal) ? (goal as MockGoal) : 'maintain'
}

export function loadMockWorkoutPlan(goal: MockGoal = 'maintain') {
  const planId = mockPlanId(goal)
  const { plan, days } = getMockPlanResponse(planId, goal)
  const workoutDays = days.filter((d) => d.type === 'workout')
  try {
    sessionStorage.setItem('formplan_plan_id', planId)
  } catch {
    /* ingen storage i test/SSR */
  }
  return { plan, workoutDays, isMock: true as const }
}
