import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { mockPlanId, type MockGoal } from '../lib/mockPlan'
import { toast } from '../lib/toast'
import { toastIfNotNetwork } from '../lib/errors'
import { settingsStore } from '../lib/settings'
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
type Step = OnboardingStep

type IconComponent = React.ComponentType<{ className?: string }>

const STEPS: Step[] = ['goal', 'level', 'equipment', 'schedule', 'diet', 'body']

const STEP_LABELS: Record<Step, string> = {
  goal: 'Ditt mål',
  level: 'Erfarenhet',
  equipment: 'Utrustning',
  schedule: 'Schema',
  diet: 'Kost',
  body: 'Om dig',
}

const GOALS: { value: string; label: string; desc: string; Icon: IconComponent; iconBg: string; iconStroke: string }[] = [
  { value: 'lose_weight', label: 'Gå ner i vikt', desc: 'Fettförbränning & deficit', Icon: FireIcon, iconBg: 'bg-orange-50', iconStroke: 'stroke-orange-500' },
  { value: 'build_muscle', label: 'Bygga muskler', desc: 'Styrka & hypertrofi', Icon: DumbbellIcon, iconBg: 'bg-forest-50', iconStroke: 'stroke-forest-600' },
  { value: 'maintain', label: 'Hålla formen', desc: 'Balans & välmående', Icon: TargetIcon, iconBg: 'bg-purple-50', iconStroke: 'stroke-purple-500' },
  { value: 'improve_endurance', label: 'Förbättra kondition', desc: 'Uthållighet & puls', Icon: HeartIcon, iconBg: 'bg-rose-50', iconStroke: 'stroke-rose-500' },
]

const LEVELS = [
  { value: 'beginner', label: 'Nybörjare', desc: '0–1 år träning' },
  { value: 'intermediate', label: 'Mellannivå', desc: '1–3 år träning' },
  { value: 'advanced', label: 'Avancerad', desc: '3+ år träning' },
]

const EQUIPMENT_OPTIONS = [
  'Gym (fullutrustat)',
  'Hantlar',
  'Skivstång',
  'Gummiband',
  'Chin-up stång',
  'Kettlebells',
  'Inga redskap (kroppsvikt)',
]

const ALLERGY_OPTIONS = ['Gluten', 'Laktos', 'Nötter', 'Ägg', 'Fisk', 'Soja', 'Vegetarian', 'Vegan']

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
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('goal')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
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
        if (!cancelled && draft) {
          setForm(draft.form)
          setStep(draft.step)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (loading) return
    saveOnboardingDraft({ step, form })
  }, [step, form, loading])

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
      toast.error((e as Error).message || 'Kunde inte öppna testschema')
      setSaving(false)
    }
  }

  async function submit() {
    if (!form.goal || !form.level) {
      toast.error('Välj mål och träningsnivå innan du skapar schema.')
      setStep(!form.goal ? 'goal' : 'level')
      return
    }
    if (form.equipment.length === 0) {
      toast.error('Välj minst en utrustningstyp.')
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

      clearOnboardingDraft()

      const { plan_id } = await api.generatePlan()
      sessionStorage.setItem('formplan_plan_id', plan_id)
      navigate(`/plan/${plan_id}`)
    } catch (e) {
      toastIfNotNetwork(e, toast.error)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-white text-stone-900 max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="px-5 pt-header pb-4 border-b border-stone-100">
        <div className="flex items-center gap-3 mb-4">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={back}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors"
              aria-label="Tillbaka"
            >
              <ChevronLeftIcon className="w-5 h-5 stroke-stone-600" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors"
              aria-label="Avbryt"
            >
              <ChevronLeftIcon className="w-5 h-5 stroke-stone-400" />
            </button>
          )}
          <div className="flex-1 text-center">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
              Steg {stepIndex + 1} av {STEPS.length}
            </p>
            <h1 className="text-lg font-bold text-stone-900">{STEP_LABELS[step]}</h1>
          </div>
          <div className="w-8" />
        </div>

        <div className="w-full bg-stone-100 rounded-full h-1.5">
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
                i <= stepIndex ? 'bg-forest-700 w-5' : 'bg-stone-200 w-1.5'
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
        ) : step === 'goal' ? (
          <div>
            <h2 className="text-2xl font-bold mb-1">Vad är ditt mål?</h2>
            <p className="text-stone-500 text-sm mb-6">Vi anpassar schemat efter detta.</p>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map(({ value, label, desc, Icon, iconBg, iconStroke }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setForm((f) => ({ ...f, goal: value })); next() }}
                  className={`flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    form.goal === value
                      ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-600'
                      : 'border-stone-100 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconStroke}`} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-stone-900 block">{label}</span>
                    <span className="text-xs text-stone-400 mt-0.5 block">{desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : step === 'level' ? (
          <div>
            <h2 className="text-2xl font-bold mb-1">Träningserfarenhet?</h2>
            <p className="text-stone-500 text-sm mb-6">Välj den nivå som stämmer bäst.</p>
            <div className="space-y-3">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => { setForm((f) => ({ ...f, level: l.value })); next() }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                    form.level === l.value
                      ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-600'
                      : 'border-stone-100 bg-white hover:bg-stone-50'
                  }`}
                >
                  <span className="font-semibold text-stone-900">{l.label}</span>
                  <span className="text-stone-400 text-sm">{l.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : step === 'equipment' ? (
          <div>
            <h2 className="text-2xl font-bold mb-1">Tillgänglig utrustning?</h2>
            <p className="text-stone-500 text-sm mb-6">Välj allt som stämmer.</p>
            <div className="space-y-2 mb-6">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const selected = form.equipment.includes(eq)
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => toggle('equipment', eq)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      selected
                        ? 'border-forest-600 bg-forest-50'
                        : 'border-stone-100 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      selected ? 'bg-forest-700 border-forest-600' : 'border-stone-300 bg-white'
                    }`}>
                      {selected && <CheckIcon className="w-3 h-3 stroke-white" />}
                    </div>
                    <span className="text-sm text-stone-800 text-left">{eq}</span>
                  </button>
                )
              })}
            </div>
            <PrimaryButton onClick={next} disabled={form.equipment.length === 0}>
              Fortsätt
            </PrimaryButton>
          </div>
        ) : step === 'schedule' ? (
          <div>
            <h2 className="text-2xl font-bold mb-1">Hur många dagar per vecka?</h2>
            <p className="text-stone-500 text-sm mb-8">Välj hur ofta du vill träna.</p>
            <div className="grid grid-cols-7 gap-2 mb-8">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, days_per_week: d }))}
                  className={`aspect-square rounded-xl font-bold text-base transition-all ${
                    form.days_per_week === d
                      ? 'bg-forest-700 text-white ring-2 ring-forest-600 ring-offset-1'
                      : 'bg-stone-50 border border-stone-100 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-stone-400 mb-6">
              {form.days_per_week} pass per vecka
            </p>
            <PrimaryButton onClick={next}>Fortsätt</PrimaryButton>
          </div>
        ) : step === 'diet' ? (
          <div>
            <h2 className="text-2xl font-bold mb-1">Allergier eller kostrestriktioner?</h2>
            <p className="text-stone-500 text-sm mb-6">Valfritt — hoppa över om inga.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {ALLERGY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggle('allergies', a)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    form.allergies.includes(a)
                      ? 'bg-forest-700 text-white'
                      : 'bg-stone-50 border border-stone-100 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <PrimaryButton onClick={next}>
              {form.allergies.length === 0 ? 'Hoppa över' : 'Fortsätt'}
            </PrimaryButton>
          </div>
        ) : step === 'body' ? (
          <div>
            <p className="text-stone-500 text-sm mb-6">
              Hjälper AI:n beräkna kalorier och näringsmål. Alla fält är valfria.
            </p>

            <div className="space-y-4 mb-6">
              {([
                { key: 'age' as const, label: 'Ålder', placeholder: 't.ex. 30', unit: 'år', min: 13, max: 120, step: 1 },
                { key: 'weight_kg' as const, label: 'Vikt', placeholder: 't.ex. 75', unit: 'kg', min: 30, max: 300, step: 0.1 },
                { key: 'height_cm' as const, label: 'Längd', placeholder: 't.ex. 175', unit: 'cm', min: 100, max: 250, step: 1 },
              ]).map(({ key, label, placeholder, unit, min, max, step }) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      id={key}
                      type="number"
                      inputMode="decimal"
                      min={min}
                      max={max}
                      step={step}
                      placeholder={placeholder}
                      value={form[key] ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value
                        const n = Number(raw)
                        // NaN får aldrig lagras — behåll null tills värdet är giltigt.
                        setForm((f) => ({ ...f, [key]: raw === '' || !Number.isFinite(n) ? null : n }))
                      }}
                      className="flex-1 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-400"
                    />
                    <span className="text-sm text-stone-400 w-8 shrink-0">{unit}</span>
                  </div>
                </div>
              ))}

              <div>
                <label htmlFor="calorie_goal" className="block text-sm font-medium text-stone-700 mb-1.5">Kalorimål</label>
                <div className="flex items-center gap-2">
                  <input
                    id="calorie_goal"
                    type="number"
                    inputMode="numeric"
                    min={800}
                    max={10000}
                    step={50}
                    placeholder="Lämna tomt = auto"
                    value={form.calorie_goal ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      const n = Number(raw)
                      // NaN får aldrig lagras — behåll null tills värdet är giltigt.
                      setForm((f) => ({ ...f, calorie_goal: raw === '' || !Number.isFinite(n) ? null : n }))
                    }}
                    className="flex-1 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-400"
                  />
                  <span className="text-sm text-stone-400 w-8 shrink-0">kcal</span>
                </div>
                <p className="text-xs text-stone-400 mt-1.5">Tomt fält räknas ut automatiskt utifrån mål och kropp.</p>
              </div>
            </div>

            <div className="space-y-3">
              <PrimaryButton onClick={submit} disabled={saving}>
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Genererar ditt schema…
                  </span>
                ) : (
                  'Skapa mitt schema'
                )}
              </PrimaryButton>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="w-full text-sm text-stone-500 hover:text-stone-700 py-2 disabled:opacity-50"
              >
                Hoppa över och skapa schema
              </button>

              {import.meta.env.DEV && (
                <div className="pt-4 mt-4 border-t border-dashed border-stone-200">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">
                    Testschema (dev)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {GOALS.map(({ value, label, desc, Icon, iconBg, iconStroke }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => submitMock(value as MockGoal)}
                        disabled={saving}
                        className="flex flex-col items-start gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50 text-left hover:bg-stone-100 active:scale-[0.98] disabled:opacity-50 transition-all"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                          <Icon className={`w-4 h-4 ${iconStroke}`} />
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-stone-800 block">{label}</span>
                          <span className="text-[10px] text-stone-400 mt-0.5 block leading-tight">{desc}</span>
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
