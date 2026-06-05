import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutStore } from '../../hooks/useWorkoutStore'
import { workoutStore } from '../../store/workoutStore'
import { workoutApi } from '../../lib/workoutApi'
import { toast } from '../../lib/toast'
import { PauseIcon, PlayIcon, CheckIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/ui/Icons'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function ActiveWorkout() {
  const navigate = useNavigate()
  const state = useWorkoutStore()
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Redirect if no active workout
  useEffect(() => {
    if (!state) navigate('/traning', { replace: true })
  }, [state, navigate])

  // Main elapsed timer
  useEffect(() => {
    if (paused) { clearInterval(intervalRef.current ?? undefined); return }
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
    return () => clearInterval(intervalRef.current ?? undefined)
  }, [paused])

  // Rest countdown
  useEffect(() => {
    if (restTimer === null) return
    if (restTimer <= 0) { setRestTimer(null); return }
    restRef.current = setInterval(() => setRestTimer((t) => (t ?? 1) - 1), 1000)
    return () => clearInterval(restRef.current ?? undefined)
  }, [restTimer])

  if (!state) return null

  const ex = state.exercises[state.currentExerciseIndex]
  const nextEx = state.exercises[state.currentExerciseIndex + 1]
  if (!ex) return null

  const totalSets = ex.sets.length
  const doneSets = ex.sets.filter((s) => s.done).length
  const nextSetIndex = ex.sets.findIndex((s) => !s.done)

  function markSetDone(setIndex: number) {
    workoutStore.update((s) => {
      const exercises = s.exercises.map((e, ei) => {
        if (ei !== s.currentExerciseIndex) return e
        return {
          ...e,
          sets: e.sets.map((st, si) =>
            si === setIndex ? { ...st, done: true } : st
          ),
        }
      })
      return { ...s, exercises }
    })
    // Start rest timer
    if (ex) setRestTimer(ex.restSeconds)
  }

  function updateSet(setIndex: number, field: 'reps' | 'weight_kg', value: string) {
    const num = value === '' ? (field === 'weight_kg' ? null : 0) : Number(value)
    workoutStore.update((s) => {
      const exercises = s.exercises.map((e, ei) => {
        if (ei !== s.currentExerciseIndex) return e
        return {
          ...e,
          sets: e.sets.map((st, si) =>
            si === setIndex ? { ...st, [field]: num } : st
          ),
        }
      })
      return { ...s, exercises }
    })
  }

  function goToExercise(delta: number) {
    workoutStore.update((s) => ({
      ...s,
      currentExerciseIndex: Math.max(0, Math.min(s.exercises.length - 1, s.currentExerciseIndex + delta)),
    }))
    setRestTimer(null)
  }

  async function finishWorkout() {
    const s = state
    if (s) {
      const completed = s.exercises.reduce(
        (n, e) => n + e.sets.filter((x) => x.done).length,
        0
      )
      // Only persist a session if the user actually logged something.
      if (completed > 0) {
        try {
          await workoutApi.logSession({
            plan_day_id: s.planDayId,
            workout_name: s.workoutName,
            started_at: new Date(s.startedAt).toISOString(),
            duration_seconds: elapsed,
            exercises: s.exercises.map((e) => ({
              name: e.name,
              sets: e.sets.map((x) => ({ reps: x.reps, weight_kg: x.weight_kg, done: x.done })),
            })),
          })
          toast.success('Pass sparat 💪')
        } catch (e) {
          toast.error((e as Error).message)
        }
      }
    }
    workoutStore.finish()
    navigate('/traning', { replace: true })
  }

  return (
    <div className="min-h-[100dvh] bg-stone-50 flex flex-col max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-white border-b border-stone-100">
        <button onClick={finishWorkout} className="flex items-center gap-1 text-stone-400 text-sm">
          <XIcon className="w-4 h-4 stroke-stone-400" /> Avsluta
        </button>
        <div className="text-center">
          <p className="text-xs text-stone-400">{state.workoutName}</p>
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          className="text-forest-600"
        >
          {paused
            ? <PlayIcon className="w-5 h-5" />
            : <PauseIcon className="w-5 h-5" />
          }
        </button>
      </div>

      {/* Timer */}
      <div className="text-center py-6 bg-white">
        <span className="text-5xl font-mono font-bold tracking-tight text-stone-900">
          {formatTime(elapsed)}
        </span>
        <p className="text-stone-400 text-xs mt-1">Tid</p>
      </div>

      {/* Rest countdown overlay */}
      {restTimer !== null && (
        <div className="mx-5 mb-4 bg-forest-50 border border-forest-200 rounded-2xl p-4 text-center">
          <p className="text-forest-700 font-semibold">Vila</p>
          <p className="text-3xl font-bold font-mono text-forest-600">{formatTime(restTimer)}</p>
          <button
            onClick={() => setRestTimer(null)}
            className="text-xs text-forest-500 mt-1 underline"
          >
            Hoppa över vila
          </button>
        </div>
      )}

      {/* Current exercise */}
      <div className="px-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => goToExercise(-1)}
            disabled={state.currentExerciseIndex === 0}
            className="p-2 disabled:opacity-30"
          >
            <ChevronLeftIcon className="w-5 h-5 stroke-stone-400" />
          </button>
          <div className="text-center">
            <p className="text-xs text-stone-400">
              Övning {state.currentExerciseIndex + 1} av {state.exercises.length}
            </p>
            <h2 className="text-xl font-bold text-stone-900 mt-0.5">{ex.name}</h2>
          </div>
          <button
            onClick={() => goToExercise(1)}
            disabled={state.currentExerciseIndex === state.exercises.length - 1}
            className="p-2 disabled:opacity-30"
          >
            <ChevronRightIcon className="w-5 h-5 stroke-stone-400" />
          </button>
        </div>

        {/* Set rows */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden mb-4">
          {/* Header */}
          <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 px-4 py-2 bg-stone-50 text-xs text-stone-400 font-medium">
            <span>Set</span>
            <span>Reps</span>
            <span>Kg</span>
            <span />
          </div>

          {ex.sets.map((set, si) => (
            <div
              key={si}
              className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center px-4 py-3 border-t border-stone-100 ${
                set.done ? 'opacity-50' : ''
              }`}
            >
              <span className="text-sm font-mono text-stone-500">{si + 1}</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder={ex.targetReps.replace(/\D/g, '') || '8'}
                value={set.reps || ''}
                onChange={(e) => updateSet(si, 'reps', e.target.value)}
                disabled={set.done}
                className="w-full bg-stone-100 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400 disabled:opacity-50"
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="—"
                value={set.weight_kg ?? ''}
                onChange={(e) => updateSet(si, 'weight_kg', e.target.value)}
                disabled={set.done}
                className="w-full bg-stone-100 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400 disabled:opacity-50"
              />
              <button
                onClick={() => markSetDone(si)}
                disabled={set.done || si !== nextSetIndex}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  set.done
                    ? 'bg-forest-600'
                    : si === nextSetIndex
                    ? 'bg-forest-600 active:bg-forest-700'
                    : 'bg-stone-200'
                }`}
              >
                <CheckIcon className="w-4 h-4 stroke-white" />
              </button>
            </div>
          ))}
        </div>

        {/* Progress */}
        <p className="text-xs text-stone-400 text-center mb-2">
          {doneSets}/{totalSets} set klara
        </p>
        <div className="w-full bg-stone-200 rounded-full h-1.5 mb-6">
          <div
            className="bg-forest-600 h-1.5 rounded-full transition-all"
            style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%` }}
          />
        </div>

        {/* Next exercise */}
        {nextEx && (
          <div className="flex items-center gap-3 bg-white rounded-xl border border-stone-100 p-3 mb-4">
            <div className="text-stone-400 text-xs">Nästa övning</div>
            <div className="font-semibold text-sm text-stone-700">{nextEx.name}</div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-5 pb-8 bg-white border-t border-stone-100 pt-4">
        {doneSets === totalSets && state.currentExerciseIndex < state.exercises.length - 1 ? (
          <button
            onClick={() => goToExercise(1)}
            className="w-full bg-forest-600 text-white font-bold py-4 rounded-2xl"
          >
            Nästa övning →
          </button>
        ) : doneSets === totalSets && state.currentExerciseIndex === state.exercises.length - 1 ? (
          <button
            onClick={finishWorkout}
            className="w-full bg-forest-600 text-white font-bold py-4 rounded-2xl"
          >
            Avsluta pass ✓
          </button>
        ) : null}
      </div>
    </div>
  )
}
