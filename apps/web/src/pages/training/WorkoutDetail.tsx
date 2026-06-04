import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { ChevronLeftIcon, PlayIcon } from '../../components/ui/Icons'
import { workoutStore } from '../../store/workoutStore'
import type { ExerciseLog } from '../../store/workoutStore'

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

interface PlanDay {
  id: string
  weekday: number
  type: string
  content: WorkoutContent
}

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [day, setDay] = useState<PlanDay | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    // The plan id is stored in session; we need the plan to find this day
    const planId = sessionStorage.getItem('formplan_plan_id')
    if (!planId) { navigate('/traning'); return }

    api.getPlan(planId).then(({ days }) => {
      const found = (days as PlanDay[]).find((d) => d.id === id)
      if (found) setDay(found)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id, navigate])

  function startWorkout() {
    if (!day) return
    const exercises: ExerciseLog[] = day.content.exercises.map((ex) => ({
      name: ex.name,
      targetSets: ex.sets,
      targetReps: ex.reps,
      restSeconds: ex.rest_seconds,
      sets: Array.from({ length: ex.sets }, () => ({ reps: 0, weight_kg: null, done: false })),
    }))
    workoutStore.start({
      planDayId: day.id,
      workoutName: day.content.name,
      startedAt: Date.now(),
      exercises,
      currentExerciseIndex: 0,
    })
    navigate(`/workout/${day.id}/active`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!day) {
    return (
      <div className="px-5 pt-12 text-center text-stone-400">
        <p>Passet hittades inte.</p>
        <button onClick={() => navigate('/traning')} className="text-forest-600 mt-2">
          Tillbaka
        </button>
      </div>
    )
  }

  const { content } = day

  return (
    <div className="pb-28">
      {/* Hero */}
      <div className="relative bg-stone-800 h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-700/60 to-stone-900/80" />
        <div className="absolute bottom-4 left-5 right-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-white/70 text-sm mb-3"
          >
            <ChevronLeftIcon className="w-4 h-4 stroke-white/70" />
            Träning
          </button>
          <h1 className="text-2xl font-bold text-white">{content.name}</h1>
          <p className="text-white/60 text-sm mt-0.5">
            {content.duration_minutes} min · {content.focus}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-4">
        <p className="text-stone-500 text-sm">
          Ett balanserat pass som tränar {content.focus.toLowerCase()} med fokus på styrka och teknik.
        </p>
      </div>

      {/* Exercise list */}
      <div className="px-5 space-y-3">
        {content.exercises.map((ex, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-stone-100"
          >
            {/* Placeholder image */}
            <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏋️</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-900 text-sm">{ex.name}</p>
              <p className="text-stone-400 text-xs mt-0.5">
                {ex.sets} set × {ex.reps} reps
              </p>
              {ex.notes && <p className="text-stone-300 text-xs mt-0.5 truncate">{ex.notes}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Start button — fixed */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-5">
        <button
          onClick={startWorkout}
          className="w-full bg-forest-600 hover:bg-forest-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-colors"
        >
          <PlayIcon className="w-5 h-5" />
          Starta pass
        </button>
      </div>
    </div>
  )
}
