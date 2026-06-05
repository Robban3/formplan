export type OnboardingStep = 'goal' | 'level' | 'equipment' | 'schedule' | 'diet' | 'body'

export interface OnboardingForm {
  goal: string
  level: string
  equipment: string[]
  days_per_week: number
  allergies: string[]
  calorie_goal: number | null
  age: number | null
  weight_kg: number | null
  height_cm: number | null
}

export interface OnboardingDraft {
  step: OnboardingStep
  form: OnboardingForm
}

const KEY = 'formplan_onboarding_draft'

export const EMPTY_ONBOARDING_FORM: OnboardingForm = {
  goal: '',
  level: '',
  equipment: [],
  days_per_week: 3,
  allergies: [],
  calorie_goal: null,
  age: null,
  weight_kg: null,
  height_cm: null,
}

export function loadOnboardingDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>
    if (!parsed.form || !parsed.step) return null
    return {
      step: parsed.step,
      form: { ...EMPTY_ONBOARDING_FORM, ...parsed.form },
    }
  } catch {
    return null
  }
}

export function saveOnboardingDraft(draft: OnboardingDraft) {
  localStorage.setItem(KEY, JSON.stringify(draft))
}

export function clearOnboardingDraft() {
  localStorage.removeItem(KEY)
}

export function profileToForm(profile: Record<string, unknown>): OnboardingForm {
  return {
    goal: String(profile.goal ?? ''),
    level: String(profile.level ?? ''),
    equipment: Array.isArray(profile.equipment) ? (profile.equipment as string[]) : [],
    days_per_week: Number(profile.days_per_week) || 3,
    allergies: Array.isArray(profile.allergies) ? (profile.allergies as string[]) : [],
    calorie_goal: profile.calorie_goal != null ? Number(profile.calorie_goal) : null,
    age: profile.age != null ? Number(profile.age) : null,
    weight_kg: profile.weight_kg != null ? Number(profile.weight_kg) : null,
    height_cm: profile.height_cm != null ? Number(profile.height_cm) : null,
  }
}
