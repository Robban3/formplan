import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { mockPlanId, type MockGoal } from '../lib/mockPlan'
import { toast } from '../lib/toast'
import { toastIfNotNetwork } from '../lib/errors'
import { settingsStore } from '../lib/settings'
import { useUnits } from '../hooks/useUnits'
import { useT } from '../hooks/useT'
import type { TextKey } from '../lib/i18n'
import {
  clearOnboardingDraft,
  EMPTY_ONBOARDING_FORM,
  loadOnboardingDraft,
  profileToForm,
  saveOnboardingDraft,
  type OnboardingForm,
  type OnboardingStep,
} from '../lib/onboardingDraft'
import {
  CheckIcon,
  ChevronLeftIcon,
  DumbbellIcon,
  FireIcon,
  HeartIcon,
  TargetIcon,
} from '../components/ui/Icons'
import {
  AGE_MIN_YEARS, AGE_MAX_YEARS,
  WEIGHT_MIN_KG, WEIGHT_MAX_KG, WEIGHT_STEP_KG,
  HEIGHT_MIN_CM, HEIGHT_MAX_CM, HEIGHT_STEP_CM,
} from '../lib/constants'
type Step = OnboardingStep

type IconComponent = React.ComponentType<{ className?: string }>

const STEPS: Step[] = ['goal', 'level', 'equipment', 'schedule', 'diet', 'body']

const STEP_LABEL_KEYS: Record<Step, TextKey> = {
  goal: 'onb.step.goal',
  level: 'onb.step.level',
  equipment: 'onb.step.equipment',
  schedule: 'onb.step.schedule',
  diet: 'onb.step.diet',
  body: 'onb.step.body',
}

/** `value` lagras i profilen; etikett och underrubrik kommer ur ordlistan. */
const GOALS: { value: string; labelKey: TextKey; descKey: TextKey; Icon: IconComponent; iconBg: string; iconStroke: string }[] = [
  { value: 'lose_weight', labelKey: 'goal.lose_weight', descKey: 'onb.goal.lose_weight.desc', Icon: FireIcon, iconBg: 'bg-orange-50', iconStroke: 'stroke-orange-500' },
  { value: 'build_muscle', labelKey: 'goal.build_muscle', descKey: 'onb.goal.build_muscle.desc', Icon: DumbbellIcon, iconBg: 'bg-forest-50 dark:bg-forest-900/30', iconStroke: 'stroke-forest-600' },
  { value: 'maintain', labelKey: 'goal.maintain', descKey: 'onb.goal.maintain.desc', Icon: TargetIcon, iconBg: 'bg-purple-50', iconStroke: 'stroke-purple-500' },
  { value: 'improve_endurance', labelKey: 'goal.improve_endurance', descKey: 'onb.goal.improve_endurance.desc', Icon: HeartIcon, iconBg: 'bg-rose-50', iconStroke: 'stroke-rose-500' },
]

const LEVELS: { value: string; labelKey: TextKey; descKey: TextKey }[] = [
  { value: 'beginner', labelKey: 'level.beginner', descKey: 'onb.level.beginner.desc' },
  { value: 'intermediate', labelKey: 'level.intermediate', descKey: 'onb.level.intermediate.desc' },
  { value: 'advanced', labelKey: 'level.advanced', descKey: 'onb.level.advanced.desc' },
]

/**
 * Utrustning och allergier LAGRAS som de här svenska strängarna i
 * fitness_profile, och skickas vidare till AI:n när schemat genereras.
 * Värdena får därför inte översättas — befintliga profiler skulle slutta
 * matcha och AI:n få andra ord än den är promptad för. Bara etiketten
 * översätts.
 */
const EQUIPMENT_OPTIONS: { value: string; key: TextKey }[] = [
  { value: 'Gym (fullutrustat)', key: 'equip.gym' },
  { value: 'Hantlar', key: 'equip.dumbbells' },
  { value: 'Skivstång', key: 'equip.barbell' },
  { value: 'Gummiband', key: 'equip.bands' },
  { value: 'Chin-up stång', key: 'equip.pullupBar' },
  { value: 'Kettlebells', key: 'equip.kettlebells' },
  { value: 'Inga redskap (kroppsvikt)', key: 'equip.bodyweight' },
]

const ALLERGY_OPTIONS: { value: string; key: TextKey }[] = [
  { value: 'Gluten', key: 'allergy.gluten' },
  { value: 'Laktos', key: 'allergy.lactose' },
  { value: 'Nötter', key: 'allergy.nuts' },
  { value: 'Ägg', key: 'allergy.eggs' },
  { value: 'Fisk', key: 'allergy.fish' },
  { value: 'Soja', key: 'allergy.soy' },
  { value: 'Vegetarian', key: 'allergy.vegetarian' },
  { value: 'Vegan', key: 'allergy.vegan' },
]

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-forest-700 hover:bg-forest-800 active:bg-forest-800 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
    >
      {children}
    </button>
  )
}

export function OnboardingPage() {
  const units = useUnits()
  const { t } = useT()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('goal')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  // Skild från loading: en MISSLYCKAD hämtning får inte se ut som "ny
  // användare". Se catch-grenen nedan.
  const [loadFailed, setLoadFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [form, setForm] = useState<OnboardingForm>(EMPTY_ONBOARDING_FORM)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const draft = loadOnboardingDraft()
      try {
        const { profile } = await api.getProfile()
        if (cancelled) return
        // Ett lokalt utkast är nyare än serverprofilen — det får företräde.
        if (draft) {
          setForm(draft.form)
          setStep(draft.step)
        } else if (profile && typeof profile === 'object') {
          setForm(profileToForm(profile as Record<string, unknown>))
        }
      } catch {
        if (cancelled) return
        if (draft) {
          setForm(draft.form)
          setStep(draft.step)
        } else {
          // Utan utkast skulle formuläret visas TOMT, som om användaren inte
          // hade något sparat. submit() upsertar hela raden, så ett sparande
          // därifrån nollade allergier, ålder, vikt och längd — tyst. Och
          // eftersom profilen då korrekt säger "inga allergier" slutar
          // kostgeneratorn filtrera utan att varna. Visa ett fel i stället.
          setLoadFailed(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [attempt])

  useEffect(() => {
    if (loading || loadFailed) return
    saveOnboardingDraft({ step, form })
  }, [step, form, loading, loadFailed])

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  function next() {
    const nextStep = STEPS[stepIndex + 1]
    if (nextStep) setStep(nextStep)
  }

  function back() {
    const prevStep = STEPS[stepIndex - 1]
    if (prevStep) setStep(prevStep)
  }

  function toggle<K extends 'equipment' | 'allergies'>(key: K, value: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }))
  }

  async function submitMock(goal: MockGoal) {
    setSaving(true)
    try {
      const payload = {
        goal,
        level: form.level || 'intermediate',
        equipment: form.equipment.length > 0 ? form.equipment : ['Gym (fullutrustat)'],
        days_per_week: form.days_per_week,
        allergies: form.allergies,
        calorie_goal: form.calorie_goal,
        protein_goal: form.protein_goal ?? null,
        age: form.age,
        weight_kg: form.weight_kg,
        height_cm: form.height_cm,
      }

      try {
        const { profile } = await api.saveProfile(payload)
        const saved = profile as { calorie_goal?: number | null } | null
        if (saved?.calorie_goal) {
          settingsStore.set('calorie_goal', saved.calorie_goal)
        } else if (form.calorie_goal) {
          settingsStore.set('calorie_goal', form.calorie_goal)
        }
      } catch {
        if (form.calorie_goal) settingsStore.set('calorie_goal', form.calorie_goal)
      }

      clearOnboardingDraft()

      const planId = mockPlanId(goal)
      sessionStorage.setItem('formplan_plan_id', planId)
      navigate(`/plan/${planId}`)
    } catch (e) {
      toast.error((e as Error).message || t('onb.err.mockPlan'))
      setSaving(false)
    }
  }

  async function submit() {
    if (!form.goal || !form.level) {
      toast.error(t('onb.err.needGoalLevel'))
      setStep(!form.goal ? 'goal' : 'level')
      return
    }
    if (form.equipment.length === 0) {
      toast.error(t('onb.err.needEquipment'))
      setStep('equipment')
      return
    }

    setSaving(true)
    try {
      const payload = {
        goal: form.goal,
        level: form.level,
        equipment: form.equipment,
        days_per_week: form.days_per_week,
        allergies: form.allergies,
        calorie_goal: form.calorie_goal,
        protein_goal: form.protein_goal ?? null,
        age: form.age,
        weight_kg: form.weight_kg,
        height_cm: form.height_cm,
      }

      const { profile } = await api.saveProfile(payload)
      const saved = profile as { calorie_goal?: number | null } | null
      if (saved?.calorie_goal) {
        settingsStore.set('calorie_goal', saved.calorie_goal)
      } else if (form.calorie_goal) {
        settingsStore.set('calorie_goal', form.calorie_goal)
      }

      // Clear the draft only AFTER generation succeeds — if generatePlan()
      // throws, the user keeps their draft instead of being stranded.
      const { plan_id } = await api.generatePlan()
      clearOnboardingDraft()
      sessionStorage.setItem('formplan_plan_id', plan_id)
      navigate(`/plan/${plan_id}`)
    } catch (e) {
      toastIfNotNetwork(e, toast.error)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="px-5 pt-header pb-4 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3 mb-4">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={back}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-700 transition-colors"
              aria-label={t('onb.back')}
            >
              <ChevronLeftIcon className="w-5 h-5 stroke-stone-600 dark:stroke-stone-300" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-700 transition-colors"
              aria-label={t('onb.cancel')}
            >
              <ChevronLeftIcon className="w-5 h-5 stroke-stone-500 dark:stroke-stone-400" />
            </button>
          )}
          <div className="flex-1 text-center">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              {t('onb.stepOf', { n: stepIndex + 1, total: STEPS.length })}
            </p>
            <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">{t(STEP_LABEL_KEYS[step])}</h1>
          </div>
          <div className="w-8" />
        </div>

        <div className="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-1.5">
          <div
            className="bg-forest-700 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-center gap-1.5 mt-3">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                i <= stepIndex ? 'bg-forest-700 w-5' : 'bg-stone-200 dark:bg-stone-700 w-1.5'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 py-6">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadFailed ? (
          <div className="pt-8 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-300">{t('onb.loadFailed')}</p>
            <button
              type="button"
              onClick={() => { setLoadFailed(false); setLoading(true); setAttempt((n) => n + 1) }}
              className="mt-4 text-sm font-semibold text-forest-700 dark:text-forest-400 underline"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        ) : step === 'goal' ? (
          <div>
            <h2 className="text-2xl font-bold mb-1">{t('onb.q.goal')}</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{t('onb.q.goalSub')}</p>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map(({ value, labelKey, descKey, Icon, iconBg, iconStroke }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setForm((f) => ({ ...f, goal: value })); next() }}
                  className={`flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    form.goal === value
                      ? 'border-forest-600 bg-forest-50 dark:bg-forest-900/30 ring-2 ring-forest-600'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconStroke}`} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 block">{t(labelKey)}</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 block">{t(descKey)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : step === 'level' ? (
          <div>
            <h2 className="text-2xl font-bold mb-1">{t('onb.q.level')}</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{t('onb.q.levelSub')}</p>
            <div className="space-y-3">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => { setForm((f) => ({ ...f, level: l.value })); next() }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                    form.level === l.value
                      ? 'border-forest-600 bg-forest-50 dark:bg-forest-900/30 ring-2 ring-forest-600'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{t(l.labelKey)}</span>
                  <span className="text-stone-500 dark:text-stone-400 text-sm">{t(l.descKey)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : step === 'equipment' ? (
          <div>
            <h2 className="text-2xl font-bold mb-1">{t('onb.q.equipment')}</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{t('onb.q.equipmentSub')}</p>
            <div className="space-y-2 mb-6">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const selected = form.equipment.includes(eq.value)
                return (
                  <button
                    key={eq.value}
                    type="button"
                    onClick={() => toggle('equipment', eq.value)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      selected
                        ? 'border-forest-600 bg-forest-50 dark:bg-forest-900/30'
                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      selected ? 'bg-forest-700 border-forest-600' : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                    }`}>
                      {selected && <CheckIcon className="w-3 h-3 stroke-white" />}
                    </div>
                    <span className="text-sm text-stone-800 dark:text-stone-200 text-left">{t(eq.key)}</span>
                  </button>
                )
              })}
            </div>
            <PrimaryButton onClick={next} disabled={form.equipment.length === 0}>
              {t('onb.continue')}
            </PrimaryButton>
          </div>
        ) : step === 'schedule' ? (
          <div>
            <h2 className="text-2xl font-bold mb-1">{t('onb.q.days')}</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-8">{t('onb.q.daysSub')}</p>
            <div className="grid grid-cols-7 gap-2 mb-8">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, days_per_week: d }))}
                  className={`aspect-square rounded-xl font-bold text-base transition-all ${
                    form.days_per_week === d
                      ? 'bg-forest-700 text-white ring-2 ring-forest-600 ring-offset-1'
                      : 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-stone-500 dark:text-stone-400 mb-6">
              {t('onb.daysPerWeek', { n: form.days_per_week })}
            </p>
            <PrimaryButton onClick={next}>{t('onb.continue')}</PrimaryButton>
          </div>
        ) : step === 'diet' ? (
          <div>
            <h2 className="text-2xl font-bold mb-1">{t('onb.q.allergies')}</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{t('onb.q.allergiesSub')}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {ALLERGY_OPTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => toggle('allergies', a.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    form.allergies.includes(a.value)
                      ? 'bg-forest-700 text-white'
                      : 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  {t(a.key)}
                </button>
              ))}
            </div>
            <PrimaryButton onClick={next}>
              {form.allergies.length === 0 ? t('onb.skip') : t('onb.continue')}
            </PrimaryButton>
          </div>
        ) : step === 'body' ? (
          <div>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
              {t('onb.bodyHint')}
            </p>

            <div className="space-y-4 mb-6">
              {([
                {
                  key: 'age' as const, label: t('onb.field.age'), placeholder: 't.ex. 30', unit: 'år',
                  min: AGE_MIN_YEARS, max: AGE_MAX_YEARS, step: 1,
                  display: (v: number) => v, store: (v: number) => v,
                },
                {
                  key: 'weight_kg' as const, label: t('onb.field.weight'), unit: units.weightLabel,
                  placeholder: `t.ex. ${units.toDisplay(75)}`,
                  min: Math.floor(units.toDisplay(WEIGHT_MIN_KG)), max: Math.ceil(units.toDisplay(WEIGHT_MAX_KG)), step: WEIGHT_STEP_KG,
                  display: units.toDisplay, store: units.toStore,
                },
                {
                  key: 'height_cm' as const, label: t('onb.field.height'), unit: units.lengthLabel,
                  placeholder: `t.ex. ${units.toDisplayLength(175)}`,
                  min: Math.floor(units.toDisplayLength(HEIGHT_MIN_CM)), max: Math.ceil(units.toDisplayLength(HEIGHT_MAX_CM)), step: HEIGHT_STEP_CM,
                  display: units.toDisplayLength, store: units.toStoreLength,
                },
              ]).map(({ key, label, placeholder, unit, min, max, step, display, store }) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      id={key}
                      type="number"
                      inputMode="decimal"
                      min={min}
                      max={max}
                      step={step}
                      placeholder={placeholder}
                      value={form[key] != null ? display(form[key] as number) : ''}
                      onChange={(e) => {
                        const raw = e.target.value
                        const n = Number(raw)
                        // NaN får aldrig lagras — behåll null tills värdet är giltigt.
                        // Lagringen är alltid metrisk; store() vänder tillbaka.
                        setForm((f) => ({
                          ...f,
                          [key]: raw === '' || !Number.isFinite(n) ? null : store(n),
                        }))
                      }}
                      className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-400"
                    />
                    <span className="text-sm text-stone-500 dark:text-stone-400 w-8 shrink-0">{unit}</span>
                  </div>
                </div>
              ))}

              <div>
                <label htmlFor="calorie_goal" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">{t('onb.calorieGoal')}</label>
                <div className="flex items-center gap-2">
                  <input
                    id="calorie_goal"
                    type="number"
                    inputMode="numeric"
                    min={800}
                    max={10000}
                    step={50}
                    placeholder={t('onb.caloriePlaceholder')}
                    value={form.calorie_goal ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      const n = Number(raw)
                      // NaN får aldrig lagras — behåll null tills värdet är giltigt.
                      setForm((f) => ({ ...f, calorie_goal: raw === '' || !Number.isFinite(n) ? null : n }))
                    }}
                    className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-400"
                  />
                  <span className="text-sm text-stone-500 dark:text-stone-400 w-8 shrink-0">kcal</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">{t('onb.calorieHint')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <PrimaryButton onClick={submit} disabled={saving}>
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('onb.generating')}
                  </span>
                ) : (
                  t('onb.createPlan')
                )}
              </PrimaryButton>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="w-full text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 py-2 disabled:opacity-50"
              >
                {t('onb.skipAndCreate')}
              </button>

              {import.meta.env.DEV && (
                <div className="pt-4 mt-4 border-t border-dashed border-stone-200 dark:border-stone-700">
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                    Testschema (dev)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {GOALS.map(({ value, labelKey, descKey, Icon, iconBg, iconStroke }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => submitMock(value as MockGoal)}
                        disabled={saving}
                        className="flex flex-col items-start gap-2 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-left hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-[0.98] disabled:opacity-50 transition-all"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                          <Icon className={`w-4 h-4 ${iconStroke}`} />
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-stone-800 dark:text-stone-200 block">{t(labelKey)}</span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 block leading-tight">{t(descKey)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
