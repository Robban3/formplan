import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

type Step = 'goal' | 'level' | 'equipment' | 'schedule' | 'diet' | 'body'

interface ProfileForm {
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

const STEPS: Step[] = ['goal', 'level', 'equipment', 'schedule', 'diet', 'body']

const GOALS = [
  { value: 'lose_weight', label: 'Gå ner i vikt', emoji: '🔥' },
  { value: 'build_muscle', label: 'Bygga muskler', emoji: '💪' },
  { value: 'maintain', label: 'Hålla formen', emoji: '⚖️' },
  { value: 'improve_endurance', label: 'Förbättra kondition', emoji: '🏃' },
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

export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('goal')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProfileForm>({
    goal: '',
    level: '',
    equipment: [],
    days_per_week: 3,
    allergies: [],
    calorie_goal: null,
    age: null,
    weight_kg: null,
    height_cm: null,
  })

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  function next() {
    const nextStep = STEPS[stepIndex + 1]
    if (nextStep) setStep(nextStep)
  }

  function toggle<K extends 'equipment' | 'allergies'>(key: K, value: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }))
  }

  async function submit() {
    setSaving(true)
    try {
      await api.saveProfile(form)
      const { plan_id } = await api.generatePlan()
      navigate(`/plan/${plan_id}`)
    } catch (e) {
      alert((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-8">
          <div
            className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {step === 'goal' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Vad är ditt mål?</h2>
            <p className="text-slate-400 mb-6">Vi anpassar schemat efter detta.</p>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => { setForm(f => ({ ...f, goal: g.value })); next() }}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border border-slate-700 hover:border-brand-500 bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  <span className="text-3xl">{g.emoji}</span>
                  <span className="font-medium text-sm">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'level' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Träningserfarenhet?</h2>
            <p className="text-slate-400 mb-6">Välj den nivå som stämmer bäst.</p>
            <div className="space-y-3">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => { setForm(f => ({ ...f, level: l.value })); next() }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-700 hover:border-brand-500 bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  <span className="font-medium">{l.label}</span>
                  <span className="text-slate-400 text-sm">{l.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'equipment' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Tillgänglig utrustning?</h2>
            <p className="text-slate-400 mb-6">Välj allt som stämmer.</p>
            <div className="space-y-2 mb-6">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  onClick={() => toggle('equipment', eq)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    form.equipment.includes(eq)
                      ? 'border-brand-500 bg-brand-900/30'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    form.equipment.includes(eq) ? 'bg-brand-500 border-brand-500' : 'border-slate-500'
                  }`}>
                    {form.equipment.includes(eq) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-sm">{eq}</span>
                </button>
              ))}
            </div>
            <button
              onClick={next}
              disabled={form.equipment.length === 0}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Nästa
            </button>
          </div>
        )}

        {step === 'schedule' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Hur många dagar per vecka?</h2>
            <p className="text-slate-400 mb-8">Välj hur ofta du vill träna.</p>
            <div className="flex justify-center gap-3 mb-8">
              {[2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  onClick={() => setForm(f => ({ ...f, days_per_week: d }))}
                  className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                    form.days_per_week === d
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <button
              onClick={next}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Nästa
            </button>
          </div>
        )}

        {step === 'diet' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Allergier eller kostrestriktioner?</h2>
            <p className="text-slate-400 mb-6">Valfritt — hoppa över om inga.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {ALLERGY_OPTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => toggle('allergies', a)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    form.allergies.includes(a)
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <button
              onClick={next}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Nästa
            </button>
          </div>
        )}

        {step === 'body' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Lite om dig (valfritt)</h2>
            <p className="text-slate-400 mb-6">Hjälper AI:n att beräkna kaloribehov.</p>
            <div className="space-y-3 mb-6">
              {([
                { key: 'age', label: 'Ålder', placeholder: '25', unit: 'år' },
                { key: 'weight_kg', label: 'Vikt', placeholder: '75', unit: 'kg' },
                { key: 'height_cm', label: 'Längd', placeholder: '175', unit: 'cm' },
                { key: 'calorie_goal', label: 'Kalorimål', placeholder: 'lämna tomt = auto', unit: 'kcal' },
              ] as const).map(({ key, label, placeholder, unit }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-24 text-slate-400 text-sm flex-shrink-0">{label}</label>
                  <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <input
                      type="number"
                      placeholder={placeholder}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value ? Number(e.target.value) : null }))}
                      className="flex-1 bg-transparent px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                    <span className="px-3 text-slate-500 text-sm">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={submit}
              disabled={saving}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {saving ? 'Genererar ditt schema...' : 'Skapa mitt schema ✨'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
