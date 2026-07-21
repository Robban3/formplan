export type DietFocus = 'balanced' | 'high_protein' | 'vegetarian' | 'low_carb'
export type MealCount = 3 | 4 | 5

export interface MealPlanFood {
  name: string
  amount_g: number
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

export interface MealPlanSlot {
  label: string
  time: string
  foods: MealPlanFood[]
  total: { kcal: number; protein_g: number; fat_g: number; carbs_g: number }
}

export interface GeneratedMealPlan {
  totalKcal: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  meals: MealPlanSlot[]
}

// ── Food database ──────────────────────────────────────────────────────────────
// [name, kcal/100g, protein/100g, fat/100g, carbs/100g, typical serving g]

type FoodDef = [string, number, number, number, number, number]

const FOODS: Record<DietFocus, Record<string, FoodDef[]>> = {
  balanced: {
    breakfast: [
      ['Havregrynsgröt', 68, 2.5, 1.4, 12, 250],
      ['Ägg (kokt)', 155, 13, 11, 1.1, 100],
      ['Bröd (råg)', 230, 7, 1.5, 46, 60],
      ['Kvarg (naturell)', 65, 11, 0.2, 4, 150],
      ['Banan', 89, 1.1, 0.3, 23, 120],
      ['Blåbär', 57, 0.7, 0.3, 14, 80],
    ],
    lunch: [
      ['Kycklingfilé (grillad)', 165, 31, 3.6, 0, 150],
      ['Quinoa (kokt)', 120, 4.4, 1.9, 21, 150],
      ['Broccoli', 34, 2.8, 0.4, 7, 150],
      ['Olivolja', 884, 0, 100, 0, 10],
      ['Tomat', 18, 0.9, 0.2, 3.9, 100],
    ],
    snack: [
      ['Äpple', 52, 0.3, 0.2, 14, 150],
      ['Mandlar', 579, 21, 50, 22, 25],
      ['Yoghurt (naturell)', 61, 3.5, 3.3, 4.7, 150],
      ['Mörk choklad 70%', 598, 7.8, 43, 46, 20],
    ],
    dinner: [
      ['Laxfilé', 208, 20, 13, 0, 150],
      ['Sötpotatis', 86, 1.6, 0.1, 20, 200],
      ['Spenat', 23, 2.9, 0.4, 3.6, 100],
      ['Olivolja', 884, 0, 100, 0, 10],
      ['Vitlök', 149, 6.4, 0.5, 33, 5],
    ],
    snack2: [
      ['Kesella', 73, 12, 0.3, 5, 150],
      ['Valnötter', 654, 15, 65, 14, 20],
      ['Proteinbar', 350, 20, 10, 45, 60],
    ],
  },
  high_protein: {
    breakfast: [
      ['Ägg (scrambled)', 149, 10, 11, 1.1, 150],
      ['Kycklingkorv', 140, 14, 8, 2, 80],
      ['Kvarg (0%)', 57, 10, 0.1, 4, 200],
      ['Proteinpulver (shake)', 370, 75, 5, 7, 30],
    ],
    lunch: [
      ['Kycklingbröst', 165, 31, 3.6, 0, 200],
      ['Ris (kokt)', 130, 2.7, 0.3, 28, 150],
      ['Broccoli', 34, 2.8, 0.4, 7, 150],
      ['Olivolja', 884, 0, 100, 0, 10],
    ],
    snack: [
      ['Proteinbar', 350, 20, 10, 45, 60],
      ['Kvarg (naturell)', 65, 11, 0.2, 4, 200],
      ['Kokt ägg', 155, 13, 11, 1.1, 80],
    ],
    dinner: [
      ['Nötkött (mager)', 217, 26, 12, 0, 200],
      ['Sötpotatis', 86, 1.6, 0.1, 20, 150],
      ['Bönmix', 120, 8, 0.5, 22, 100],
      ['Olivolja', 884, 0, 100, 0, 10],
    ],
    snack2: [
      ['Proteinpulver (shake)', 370, 75, 5, 7, 30],
      ['Kesella', 73, 12, 0.3, 5, 200],
    ],
  },
  vegetarian: {
    breakfast: [
      ['Havregrynsgröt', 68, 2.5, 1.4, 12, 300],
      ['Banan', 89, 1.1, 0.3, 23, 120],
      ['Mandelmjölk', 17, 0.6, 1.1, 1.5, 200],
      ['Chiafrön', 486, 17, 31, 42, 20],
    ],
    lunch: [
      ['Linser (kokta)', 116, 9, 0.4, 20, 200],
      ['Tofu', 76, 8, 4.8, 1.9, 150],
      ['Quinoa (kokt)', 120, 4.4, 1.9, 21, 150],
      ['Paprika', 31, 1, 0.3, 6, 100],
      ['Olivolja', 884, 0, 100, 0, 10],
    ],
    snack: [
      ['Hummus', 166, 7.9, 10, 14, 80],
      ['Äpple', 52, 0.3, 0.2, 14, 150],
      ['Mandlar', 579, 21, 50, 22, 25],
    ],
    dinner: [
      ['Kikärter', 164, 8.9, 2.6, 27, 200],
      ['Kyckling–ersättning (Quorn)', 90, 14, 2.5, 4, 150],
      ['Ris (kokt)', 130, 2.7, 0.3, 28, 150],
      ['Spenat', 23, 2.9, 0.4, 3.6, 100],
      ['Kokosmjölk', 230, 2.3, 24, 3.3, 50],
    ],
    snack2: [
      ['Jordnötssmör', 588, 25, 50, 20, 30],
      ['Fullkornsbröd', 250, 8, 2, 47, 50],
      ['Bär (blandade)', 50, 1, 0.3, 11, 100],
    ],
  },
  low_carb: {
    breakfast: [
      ['Ägg (stekt)', 196, 13, 16, 1.1, 120],
      ['Bacon (mager)', 218, 30, 11, 0, 60],
      ['Avokado', 160, 2, 15, 9, 80],
      ['Spenat', 23, 2.9, 0.4, 3.6, 50],
    ],
    lunch: [
      ['Laxfilé', 208, 20, 13, 0, 180],
      ['Broccoli', 34, 2.8, 0.4, 7, 200],
      ['Olivolja', 884, 0, 100, 0, 15],
      ['Fetaost', 264, 14, 21, 4, 40],
    ],
    snack: [
      ['Mandlar', 579, 21, 50, 22, 30],
      ['Mörk choklad 85%', 598, 9, 46, 24, 25],
      ['Kokt ägg', 155, 13, 11, 1.1, 80],
    ],
    dinner: [
      ['Kycklingbröst', 165, 31, 3.6, 0, 200],
      ['Blomkål', 25, 1.9, 0.3, 5, 200],
      ['Olivolja', 884, 0, 100, 0, 15],
      ['Grädde', 340, 2, 35, 3.5, 30],
    ],
    snack2: [
      ['Kvarg (naturell)', 65, 11, 0.2, 4, 150],
      ['Valnötter', 654, 15, 65, 14, 25],
    ],
  },
}

const MEAL_CONFIGS: Record<MealCount, { key: string; label: string; time: string; share: number }[]> = {
  3: [
    { key: 'breakfast', label: 'Frukost', time: '07:30', share: 0.30 },
    { key: 'lunch',     label: 'Lunch',   time: '12:30', share: 0.40 },
    { key: 'dinner',    label: 'Middag',  time: '18:00', share: 0.30 },
  ],
  4: [
    { key: 'breakfast', label: 'Frukost',  time: '07:30', share: 0.25 },
    { key: 'lunch',     label: 'Lunch',    time: '12:00', share: 0.35 },
    { key: 'snack',     label: 'Mellanmål',time: '15:30', share: 0.10 },
    { key: 'dinner',    label: 'Middag',   time: '18:30', share: 0.30 },
  ],
  5: [
    { key: 'breakfast', label: 'Frukost',   time: '07:00', share: 0.22 },
    { key: 'snack',     label: 'Förmiddagsmellanmål', time: '10:00', share: 0.10 },
    { key: 'lunch',     label: 'Lunch',     time: '12:30', share: 0.30 },
    { key: 'snack2',    label: 'Eftermiddagsmellanmål', time: '15:30', share: 0.10 },
    { key: 'dinner',    label: 'Middag',    time: '19:00', share: 0.28 },
  ],
}

function calcFood(food: FoodDef, targetKcal: number): MealPlanFood {
  const [name, kcalPer100, pPer100, fPer100, cPer100, servingG] = food
  // Start from typical serving, then scale to hit calorie target
  const scaledG = Math.round((targetKcal / kcalPer100) * 100)
  // Clamp between 50% and 200% of typical serving
  const g = Math.max(servingG * 0.5, Math.min(servingG * 2, scaledG))
  const f = g / 100
  return {
    name,
    amount_g: Math.round(g),
    kcal: Math.round(kcalPer100 * f),
    protein_g: Math.round(pPer100 * f * 10) / 10,
    fat_g: Math.round(fPer100 * f * 10) / 10,
    carbs_g: Math.round(cPer100 * f * 10) / 10,
  }
}

function pickFoodsForMeal(
  slotKey: string,
  targetKcal: number,
  focus: DietFocus,
  rng: () => number
): MealPlanFood[] {
  const pool = FOODS[focus][slotKey as keyof typeof FOODS[typeof focus]] ?? FOODS[focus]['snack']
  // Shuffle pool
  const shuffled = [...(pool ?? [])].sort(() => rng() - 0.5)

  const foods: MealPlanFood[] = []
  let remaining = targetKcal

  // Pick 2-3 items for main meals, 1-2 for snacks
  const maxItems = slotKey.includes('snack') ? 2 : 3

  for (let i = 0; i < Math.min(shuffled.length, maxItems) && remaining > 40; i++) {
    const food = shuffled[i]!
    // Give first item ~60% of remaining, rest share the rest
    const share = i === 0 ? 0.6 : 0.5
    const foodKcal = Math.max(50, remaining * share)
    const item = calcFood(food, foodKcal)
    if (item.kcal < 10) continue
    foods.push(item)
    remaining -= item.kcal
  }

  // Rescale so the meal lands near its calorie share — the serving clamp in
  // calcFood can otherwise leave small-serving slots far under target.
  const total = foods.reduce((s, f) => s + f.kcal, 0)
  if (total > 0) {
    const factor = Math.max(0.5, Math.min(2.5, targetKcal / total))
    if (Math.abs(1 - factor) > 0.05) {
      for (const f of foods) {
        f.amount_g = Math.round(f.amount_g * factor)
        f.kcal = Math.round(f.kcal * factor)
        f.protein_g = Math.round(f.protein_g * factor * 10) / 10
        f.fat_g = Math.round(f.fat_g * factor * 10) / 10
        f.carbs_g = Math.round(f.carbs_g * factor * 10) / 10
      }
    }
  }

  return foods
}

function sumFoods(foods: MealPlanFood[]) {
  return foods.reduce(
    (acc, f) => ({
      kcal: acc.kcal + f.kcal,
      protein_g: acc.protein_g + f.protein_g,
      fat_g: acc.fat_g + f.fat_g,
      carbs_g: acc.carbs_g + f.carbs_g,
    }),
    { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 }
  )
}

/** Seeded pseudo-random so same inputs give same output */
function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export function generateMealPlan(
  targetKcal: number,
  mealCount: MealCount,
  focus: DietFocus,
  variation = 0
): GeneratedMealPlan {
  const configs = MEAL_CONFIGS[mealCount]
  const rng = seededRng(
    targetKcal
    + mealCount * 1000
    + ['balanced','high_protein','vegetarian','low_carb'].indexOf(focus) * 100
    + variation * 7919   // prime number to spread seeds well
  )

  const meals: MealPlanSlot[] = configs.map((cfg) => {
    const slotKcal = Math.round(targetKcal * cfg.share)
    const foods = pickFoodsForMeal(cfg.key, slotKcal, focus, rng)
    const total = sumFoods(foods)
    return { label: cfg.label, time: cfg.time, foods, total }
  })

  const grand = sumFoods(meals.flatMap((m) => m.foods))
  return {
    totalKcal: grand.kcal,
    totalProtein: Math.round(grand.protein_g),
    totalFat: Math.round(grand.fat_g),
    totalCarbs: Math.round(grand.carbs_g),
    meals,
  }
}
