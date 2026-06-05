import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { ExerciseVideo } from '../components/training/ExerciseVideo'

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

interface PlanDayRow {
  id: string
  weekday: number
  type: 'workout' | 'nutrition' | 'rest'
  content: WorkoutContent | NutritionContent | { notes: string }
}

interface PlanRow {
  id: string
  status: 'generating' | 'ready' | 'error'
  created_at: string
}

const WEEKDAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

export function PlanPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<PlanRow | null>(null)
  const [days, setDays] = useState<PlanDayRow[]>([])
  const [selected, setSelected] = useState(1)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const { plan, days } = await api.getPlan(id)
      setPlan(plan as PlanRow)
      setDays(days as PlanDayRow[])
      if ((plan as PlanRow).status === 'generating') {
        setPolling(true)
      } else {
        setPolling(false)
        setLoading(false)
        if ((plan as PlanRow).status === 'ready') {
          sessionStorage.setItem('formplan_plan_id', id)
        }
      }
    } catch {
      setPlan(null)
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Poll while generating, with a gentle backoff (2s → 8s) instead of a tight loop.
  useEffect(() => {
    if (!polling) return
    let cancelled = false
    let attempt = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = async () => {
      await load()
      if (cancelled) return
      attempt++
      timer = setTimeout(tick, Math.min(2000 + attempt * 1000, 8000))
    }
    timer = setTimeout(tick, 2000)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [polling, load])

  if (loading || plan?.status === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">AI genererar ditt personliga schema...</p>
        <p className="text-slate-600 text-sm">Det tar ungefär 15–30 sekunder</p>
      </div>
    )
  }

  if (plan?.status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
        <p className="text-red-400">Något gick fel vid generering.</p>
        <button onClick={() => navigate('/')} className="text-brand-400 hover:underline">
          Tillbaka
        </button>
      </div>
    )
  }

  const workoutDays = days.filter((d) => d.type === 'workout')
  const nutritionDays = days.filter((d) => d.type === 'nutrition')
  const selectedWorkout = workoutDays.find((d) => d.weekday === selected)
  const selectedNutrition = nutritionDays.find((d) => d.weekday === selected)

  return (
    <div className="min-h-screen pb-8 bg-slate-950 text-slate-100">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-200">
              ←
            </button>
            <h1 className="text-xl font-bold">Mitt schema</h1>
          </div>
          <button
            onClick={() => navigate('/traning')}
            className="text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl transition-colors"
          >
            Öppna appen →
          </button>
        </div>

        {/* Day selector */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {WEEKDAYS.map((day, i) => {
            const weekday = i + 1
            const hasWorkout = workoutDays.some((d) => d.weekday === weekday)
            return (
              <button
                key={weekday}
                onClick={() => setSelected(weekday)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl flex-shrink-0 transition-all ${
                  selected === weekday
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="text-xs font-medium">{day}</span>
                {hasWorkout && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${selected === weekday ? 'bg-white' : 'bg-brand-500'}`} />
                )}
              </button>
            )
          })}
        </div>

        {/* Workout card */}
        {selectedWorkout && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">{(selectedWorkout.content as WorkoutContent).name}</h2>
                <p className="text-slate-400 text-sm">{(selectedWorkout.content as WorkoutContent).focus}</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-lg">
                {(selectedWorkout.content as WorkoutContent).duration_minutes} min
              </span>
            </div>
            <div className="space-y-4">
              {(selectedWorkout.content as WorkoutContent).exercises.map((ex, i) => (
                <div key={i}>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-xs text-slate-400 flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ex.name}</p>
                      <p className="text-slate-400 text-xs">{ex.sets} set × {ex.reps} · {ex.rest_seconds}s vila</p>
                      {ex.notes && <p className="text-slate-500 text-xs mt-0.5">{ex.notes}</p>}
                    </div>
                  </div>
                  <div className="mt-2 ml-9">
                    <ExerciseVideo exerciseName={ex.name} variant="card" dark />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedWorkout && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-4 text-center">
            <p className="text-slate-400">Vildag 🛌</p>
          </div>
        )}

        {/* Nutrition card */}
        {selectedNutrition && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h2 className="font-bold mb-1">Kostplan</h2>
            <div className="flex gap-4 mb-4 text-sm">
              {[
                { label: 'Kalorier', value: `${(selectedNutrition.content as NutritionContent).total_calories} kcal` },
                { label: 'Protein', value: `${(selectedNutrition.content as NutritionContent).protein_g}g` },
                { label: 'Kolhydrater', value: `${(selectedNutrition.content as NutritionContent).carbs_g}g` },
                { label: 'Fett', value: `${(selectedNutrition.content as NutritionContent).fat_g}g` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-slate-500 text-xs">{label}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {(selectedNutrition.content as NutritionContent).meals.map((meal, i) => (
                <div key={i} className="border-t border-slate-700 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{meal.name}</p>
                    <span className="text-xs text-slate-400">{meal.time} · {meal.calories} kcal</span>
                  </div>
                  <ul className="text-slate-400 text-xs space-y-0.5">
                    {meal.items.map((item, j) => <li key={j}>• {item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
