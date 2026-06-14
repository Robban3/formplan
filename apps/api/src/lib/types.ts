export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  ANTHROPIC_API_KEY: string
  ANTHROPIC_MODEL?: string
  // AI-provider: 'anthropic' (standard) eller 'gemini' (gratis nivå för test).
  AI_PROVIDER?: 'anthropic' | 'gemini'
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  RESEND_API_KEY: string
  WEBHOOK_SECRET: string
  ENVIRONMENT: string
}

export interface JwtPayload {
  sub: string
  email: string
  role: string
  created_at?: string
  app_metadata: {
    provider: string
  }
  user_metadata: Record<string, unknown>
  aud: string
  exp: number
}

// Shared Hono generic — bindings + the authenticated user set by requireAuth.
export type AppContext = {
  Bindings: Env
  Variables: { user: JwtPayload }
}

export interface FitnessProfile {
  user_id: string
  goal: 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_endurance'
  level: 'beginner' | 'intermediate' | 'advanced'
  equipment: string[]
  days_per_week: number
  allergies: string[]
  calorie_goal: number | null
  age: number | null
  weight_kg: number | null
  height_cm: number | null
  updated_at: string
}

export interface Plan {
  id: string
  user_id: string
  status: 'generating' | 'ready' | 'error'
  created_at: string
}

export interface PlanDay {
  id: string
  plan_id: string
  weekday: number // 1=Mon … 7=Sun
  type: 'workout' | 'nutrition' | 'rest'
  content: WorkoutDay | NutritionDay | RestDay
}

export interface WorkoutDay {
  name: string
  focus: string
  duration_minutes: number
  exercises: Exercise[]
}

export interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  notes?: string
}

export interface NutritionDay {
  total_calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  meals: Meal[]
}

export interface Meal {
  name: string
  time: string
  calories: number
  items: string[]
}

export interface RestDay {
  notes: string
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

export interface MealEstimate {
  name: string
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

export type MealSlot = 'frukost' | 'lunch' | 'middag' | 'mellanmar'

export interface FoodItemRow {
  id: string
  name: string
  brand: string | null
  kcal_per_100g: number
  protein_per_100g: number
  fat_per_100g: number
  carbs_per_100g: number
  serving_size_g: number | null
}

export interface FoodLogRow {
  id: string
  user_id: string
  log_date: string
  meal_slot: MealSlot
  food_id: string | null
  food_name: string
  amount_g: number
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  serving_label: string | null
}

export interface WaterLogRow {
  id: string
  user_id: string
  log_date: string
  amount_ml: number
  logged_at: string
}

export interface DailyGoals {
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

export interface WorkoutSessionRow {
  id: string
  user_id: string
  plan_day_id: string | null
  workout_name: string
  started_at: string
  completed_at: string
  duration_seconds: number
  total_sets: number
  completed_sets: number
  total_volume_kg: number
  exercises: unknown
}
