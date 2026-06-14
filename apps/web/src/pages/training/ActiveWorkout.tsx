import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutStore } from '../../hooks/useWorkoutStore'
import { useSettings } from '../../hooks/useSettings'
import { useUnits } from '../../hooks/useUnits'
import { workoutStore } from '../../store/workoutStore'
import { workoutApi } from '../../lib/workoutApi'
import { addLocalSession } from '../../lib/workoutSessionStore'
import { saveRpe } from '../../lib/rpeStore'
import { checkAndUpdatePR } from '../../lib/prStore'
import { toast } from '../../lib/toast'
import { PauseIcon, PlayIcon, CheckIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, ShareIcon, DumbbellIcon, ZapIcon } from '../../components/ui/Icons'
import { ExerciseVideo } from '../../components/training/ExerciseVideo'
import { exerciseUsesWeight, isCardioExercise } from '../../lib/exerciseLog'
import { getExerciseHistory } from '../../lib/exerciseHistoryStore'
import { recommendNextWeight, type ProgressionAdvice } from '../../lib/progression'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

interface PrevSet { reps: number; weight_kg: number | null }

export function ActiveWorkout() {
  const navigate = useNavigate()
  const state = useWorkoutStore()
  const { auto_rest, rest_seconds_default, keep_screen_on } = useSettings()
  const { weightLabel, toDisplay, toStore, formatWeight } = useUnits()
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showRpe, setShowRpe] = useState(false)
  const [pendingWorkoutName, setPendingWorkoutName] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const advanceToRef = useRef<number | null>(null)
  const finishingRef = useRef(false)
  // previousSets[exerciseName] = last logged sets for that exercise
  const [previousSets, setPreviousSets] = useState<Record<string, PrevSet[]>>({})
  // recommendations[exerciseName] = automatic progression suggestion (or null)
  const [recommendations, setRecommendations] = useState<Record<string, ProgressionAdvice | null>>({})

  // Fetch exercise history for all exercises in this workout once on mount.
  useEffect(() => {
    if (!state) return
    const names = [...new Set(state.exercises.map((e) => e.name))]

    // Automatic progression from locally tracked history (offline-friendly).
    const recs: Record<string, ProgressionAdvice | null> = {}
    for (const name of names) {
      const targetReps = state.exercises.find((e) => e.name === name)?.targetReps ?? ''
      recs[name] = recommendNextWeight(getExerciseHistory(name), targetReps)
    }
    setRecommendations(recs)

    Promise.all(
      names.map((name) =>
        workoutApi
          .getExerciseHistory(name)
          .then(({ history }) => ({ name, sets: history[0]?.sets ?? [] }))
          .catch(() => ({ name, sets: [] }))
      )
    ).then((results) => {
      const map: Record<string, PrevSet[]> = {}
      for (const r of results) map[r.name] = r.sets
      setPreviousSets(map)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.planDayId])

  // Redirect if no active workout (skip when user just finished and saved)
  useEffect(() => {
    if (!state && !finishingRef.current) navigate('/traning', { replace: true })
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
    if (restTimer <= 0) {
      setRestTimer(null)
      if (advanceToRef.current !== null) {
        const idx = advanceToRef.current
        advanceToRef.current = null
        workoutStore.update((s) => ({
          ...s,
          currentExerciseIndex: idx,
        }))
      }
      return
    }
    restRef.current = setInterval(() => setRestTimer((t) => (t ?? 1) - 1), 1000)
    return () => clearInterval(restRef.current ?? undefined)
  }, [restTimer])

  // Keep screen awake during workout when enabled
  useEffect(() => {
    if (!keep_screen_on || !('wakeLock' in navigator)) return

    let wakeLock: WakeLockSentinel | null = null

    async function acquire() {
      try {
        wakeLock = await navigator.wakeLock.request('screen')
      } catch {
        // Unsupported or denied — ignore silently
      }
    }

    acquire()

    function onVisible() {
      if (document.visibilityState === 'visible') acquire()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      wakeLock?.release()
    }
  }, [keep_screen_on])

  function shareWorkout(name: string, durationSec: number, doneSet: number, totalSet: number) {
    const mins = Math.round(durationSec / 60)
    const text = `💪 Jag klarade ${name} på FormPlan!\n⏱ ${mins} min · ${doneSet}/${totalSet} set klara\n\nLadda ner FormPlan och träna med mig!`
    if (navigator.share) {
      navigator.share({ title: 'Mitt träningspass', text }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text).then(() => toast.success('Kopierat till urklipp!')).catch(() => {})
    }
  }

  // RPE modal (shown after finishing, before navigating home)
  if (showRpe) {
    const doneSetCount = workoutStore.get()?.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0) ?? 0
    const totalSetCount = workoutStore.get()?.exercises.reduce((n, e) => n + e.sets.length, 0) ?? 0
    return (
      <div className="min-h-[100dvh] bg-canvas flex flex-col items-center justify-center px-5 gap-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-forest-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DumbbellIcon className="w-8 h-8 stroke-forest-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900">Bra jobbat!</h2>
          <p className="text-stone-500 mt-1">{pendingWorkoutName}</p>
        </div>

        {/* Dela pass */}
        <button
          onClick={() => shareWorkout(pendingWorkoutName, elapsed, doneSetCount, totalSetCount)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-stone-200 text-sm font-medium text-stone-700 shadow-sm"
        >
          <ShareIcon className="w-4 h-4 stroke-stone-500" />
          Dela passet
        </button>

        <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-100 p-5">
          <p className="font-semibold text-stone-800 text-center mb-4">Hur ansträngande var passet?</p>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <button
                key={n}
                onClick={() => {
                  saveRpe(pendingWorkoutName, n)
                  setShowRpe(false)
                  navigate('/', { replace: true })
                }}
                className={`aspect-square rounded-xl text-sm font-bold transition-colors ${
                  n <= 3 ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                  : n <= 6 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-400 text-center">1 = Extremt lätt · 10 = Maximalt</p>
        </div>
        <button
          onClick={() => { setShowRpe(false); navigate('/', { replace: true }) }}
          className="text-sm text-stone-400"
        >
          Hoppa över
        </button>
      </div>
    )
  }

  if (!state) return null

  const workout = state
  const currentEx = workout.exercises[workout.currentExerciseIndex]
  if (!currentEx) return null
  const ex = currentEx

  const totalSets = ex.sets.length
  const doneSets = ex.sets.filter((s) => s.done).length
  const nextSetIndex = ex.sets.findIndex((s) => !s.done)
  const workoutTotalSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0)
  const workoutDoneSets = workout.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.done).length,
    0
  )
  const workoutComplete = workoutDoneSets === workoutTotalSets
  const currentExerciseComplete = doneSets === totalSets

  function firstIncompleteExerciseIndex(from = 0): number | null {
    for (let i = from; i < workout.exercises.length; i++) {
      if (workout.exercises[i]!.sets.some((s) => !s.done)) return i
    }
    for (let i = 0; i < from; i++) {
      if (workout.exercises[i]!.sets.some((s) => !s.done)) return i
    }
    return null
  }

  function defaultRepsFor(exercise: NonNullable<typeof ex>): number {
    const n = parseInt(exercise.targetReps.replace(/\D/g, ''), 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  }
  const isCardio = isCardioExercise(ex.name)
  const showWeight = exerciseUsesWeight(ex.name, ex.targetReps)
  const setGrid = showWeight || isCardio
    ? 'grid-cols-[2rem_1fr_1fr_2.5rem]'
    : 'grid-cols-[2rem_1fr_2.5rem]'

  /** Epley formula: 1RM ≈ weight × (1 + reps/30) */
  function calc1RM(weightKg: number, reps: number): number {
    if (reps <= 0 || weightKg <= 0) return 0
    if (reps === 1) return weightKg
    return Math.round(weightKg * (1 + reps / 30))
  }

  function markSetDone(setIndex: number) {
    const fallbackReps = defaultRepsFor(ex)
    const set = ex.sets[setIndex]

    // PR check before state update
    if (set && showWeight && set.weight_kg && set.weight_kg > 0) {
      const reps = set.reps || fallbackReps
      const isNewPR = checkAndUpdatePR(ex.name, toStore(set.weight_kg), reps)
      if (isNewPR) {
        setTimeout(() => toast.success(`🏆 Nytt personbästa på ${ex.name}!`), 100)
      }
    }

    workoutStore.update((s) => {
      const exercises = s.exercises.map((e, ei) => {
        if (ei !== s.currentExerciseIndex) return e
        return {
          ...e,
          sets: e.sets.map((st, si) =>
            si === setIndex
              ? { ...st, done: true, ...(isCardio ? {} : { reps: st.reps || fallbackReps }) }
              : st
          ),
        }
      })
      return { ...s, exercises }
    })

    const updated = workoutStore.get()
    if (!updated) return

    const cur = updated.exercises[updated.currentExerciseIndex]
    const exerciseDone = cur?.sets.every((s) => s.done) ?? false
    const allDone = updated.exercises.every((e) => e.sets.every((s) => s.done))

    if (exerciseDone && !allDone) {
      const nextIdx = firstIncompleteExerciseIndex(updated.currentExerciseIndex + 1)
      if (nextIdx !== null) {
        if (auto_rest && ex) {
          const rest = ex.restSeconds > 0 ? ex.restSeconds : rest_seconds_default
          advanceToRef.current = nextIdx
          setRestTimer(rest)
        } else {
          goToExerciseIndex(nextIdx)
        }
      }
    }

    if (!exerciseDone && auto_rest && ex) {
      const rest = ex.restSeconds > 0 ? ex.restSeconds : rest_seconds_default
      setRestTimer(rest)
    }
  }

  function updateSet(
    setIndex: number,
    field: 'reps' | 'weight_kg' | 'duration_min' | 'distance_km',
    value: string
  ) {
    const num = value === ''
      ? (field === 'reps' ? 0 : null)
      : field === 'weight_kg'
      ? toStore(Number(value))
      : Number(value)
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

  // Prefill the recommended weight on all not-yet-completed sets of the current exercise.
  function applyRecommendation(weightKg: number) {
    workoutStore.update((s) => ({
      ...s,
      exercises: s.exercises.map((e, ei) =>
        ei === s.currentExerciseIndex
          ? { ...e, sets: e.sets.map((st) => (st.done ? st : { ...st, weight_kg: weightKg })) }
          : e
      ),
    }))
  }

  function goToExercise(delta: number) {
    goToExerciseIndex(workout.currentExerciseIndex + delta)
  }

  function goToExerciseIndex(index: number) {
    workoutStore.update((s) => ({
      ...s,
      currentExerciseIndex: Math.max(0, Math.min(s.exercises.length - 1, index)),
    }))
    advanceToRef.current = null
    setRestTimer(null)
  }

  function requestFinish() {
    if (workoutComplete) {
      finishWorkout()
      return
    }
    const completed = workout.exercises.reduce(
      (n, e) => n + e.sets.filter((x) => x.done).length,
      0
    )
    if (
      completed === 0 ||
      window.confirm('Avsluta passet nu? Det du loggat hittills sparas.')
    ) {
      finishWorkout()
    }
  }

  async function finishWorkout() {
    if (saving) return
    const snapshot = workoutStore.get()
    if (!snapshot) {
      toast.error('Inget aktivt pass att spara.')
      return
    }

    setSaving(true)
    finishingRef.current = true

    const input = {
      plan_day_id: snapshot.planDayId,
      workout_name: snapshot.workoutName,
      started_at: new Date(snapshot.startedAt).toISOString(),
      duration_seconds: elapsed,
      exercises: snapshot.exercises.map((e) => ({
        name: e.name,
        sets: e.sets.map((x) => ({
          reps: x.reps,
          weight_kg: x.weight_kg,
          done: x.done,
          duration_min: x.duration_min ?? null,
          distance_km: x.distance_km ?? null,
        })),
      })),
    }

    const completed = snapshot.exercises.reduce(
      (n, e) => n + e.sets.filter((x) => x.done).length,
      0
    )

    // Always save locally first — this updates Hem and Analys immediately
    addLocalSession(input)

    toast.success(completed > 0 ? 'Pass sparat!' : 'Pass avslutat!')
    const name = snapshot.workoutName
    workoutStore.finish()
    setSaving(false)

    // Show RPE rating before navigating
    if (completed > 0) {
      setPendingWorkoutName(name)
      setShowRpe(true)
    } else {
      navigate('/', { replace: true })
    }

    // Sync to API in background (best-effort)
    workoutApi.logSession(input).catch(() => {})
  }

  const nextIncompleteIndex = currentExerciseComplete
    ? firstIncompleteExerciseIndex(workout.currentExerciseIndex + 1)
    : null
  const nextIncompleteEx =
    nextIncompleteIndex !== null ? workout.exercises[nextIncompleteIndex] : null

  return (
    <div className="min-h-[100dvh] bg-canvas flex flex-col max-w-lg mx-auto overflow-x-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-header pb-4 bg-white border-b border-stone-100">
        <button onClick={requestFinish} className="flex items-center gap-1 text-stone-400 text-sm">
          <XIcon className="w-4 h-4 stroke-stone-400" /> Avsluta
        </button>
        <div className="text-center">
          <p className="text-xs text-stone-400">{workout.workoutName}</p>
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
            disabled={workout.currentExerciseIndex === 0}
            className="p-2 disabled:opacity-30"
          >
            <ChevronLeftIcon className="w-5 h-5 stroke-stone-400" />
          </button>
          <div className="text-center">
            <p className="text-xs text-stone-400">
              Övning {workout.currentExerciseIndex + 1} av {workout.exercises.length}
            </p>
            <div className="flex items-center gap-2 justify-center">
              <h2 className="text-xl font-bold text-stone-900 mt-0.5">{ex.name}</h2>
              {ex.supersetGroup !== undefined && (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">SS</span>
              )}
            </div>
            {(() => {
              if (isCardio) return null
              const prev = previousSets[ex.name]
              if (!prev || prev.length === 0) return null
              const kg = prev[0]?.weight_kg
              const reps = prev[0]?.reps
              return (
                <p className="text-xs text-stone-400 mt-0.5">
                  Förra: {kg != null ? formatWeight(kg) : '—'} × {reps ?? '—'} reps
                </p>
              )
            })()}
          </div>
          <button
            onClick={() => goToExercise(1)}
            disabled={workout.currentExerciseIndex === workout.exercises.length - 1}
            className="p-2 disabled:opacity-30"
          >
            <ChevronRightIcon className="w-5 h-5 stroke-stone-400" />
          </button>
        </div>

        <ExerciseVideo exerciseName={ex.name} variant="inline" />

        {/* Automatic progression suggestion */}
        {showWeight && recommendations[ex.name] && (() => {
          const rec = recommendations[ex.name]!
          const applied = ex.sets.some((s) => !s.done && s.weight_kg != null && Math.abs(s.weight_kg - rec.recommendedWeight_kg) < 0.05)
          return (
            <div className="flex items-center gap-3 bg-forest-50 border border-forest-200 rounded-2xl px-4 py-3 mb-4">
              <ZapIcon className="w-5 h-5 stroke-forest-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-forest-800">
                  Dags att öka till {formatWeight(rec.recommendedWeight_kg)}
                </p>
                <p className="text-[11px] text-forest-600 mt-0.5">
                  Du klarade {rec.reachedReps} reps på {formatWeight(rec.lastWeight_kg)} två pass i rad.
                </p>
              </div>
              <button
                onClick={() => applyRecommendation(rec.recommendedWeight_kg)}
                disabled={applied}
                className="text-xs font-semibold bg-forest-700 text-white px-3 py-2 rounded-xl flex-shrink-0 disabled:opacity-50"
              >
                {applied ? 'Tillämpad' : 'Använd'}
              </button>
            </div>
          )
        })()}

        {/* Set rows */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden mb-4">
          {/* Header */}
          <div className={`grid ${setGrid} gap-2 px-4 py-2 bg-stone-50 text-xs text-stone-400 font-medium`}>
            <span>Set</span>
            <span>{isCardio ? 'Tid (min)' : 'Reps'}</span>
            {isCardio ? <span>Distans (km)</span> : showWeight && <span>Vikt ({weightLabel})</span>}
            <span />
          </div>

          {isCardio ? (
            <p className="px-4 py-2 text-xs text-stone-400 border-b border-stone-50">
              Kondition — fyll i tid och distans per pass.
            </p>
          ) : !showWeight && (
            <p className="px-4 py-2 text-xs text-stone-400 border-b border-stone-50">
              Kroppsvikt — fyll i antal reps per set.
            </p>
          )}

          {ex.sets.map((set, si) => {
            const oneRM = set.done && set.weight_kg && set.reps > 1
              ? calc1RM(toStore(set.weight_kg), set.reps)
              : null
            return (
            <div
              key={si}
              className={`grid ${setGrid} gap-2 items-center px-4 py-3 border-t border-stone-100 ${
                set.done ? 'bg-stone-50' : ''
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-mono text-stone-500">{si + 1}</span>
                {oneRM && (
                  <span className="text-[9px] text-forest-600 font-semibold">1RM~{oneRM}</span>
                )}
              </div>
              {isCardio ? (
                <>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={ex.targetReps.replace(/\D/g, '') || 'min'}
                    value={set.duration_min ?? ''}
                    onChange={(e) => updateSet(si, 'duration_min', e.target.value)}
                    disabled={set.done}
                    className="min-w-0 w-full bg-stone-100 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400 disabled:opacity-50"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="km"
                    value={set.distance_km ?? ''}
                    onChange={(e) => updateSet(si, 'distance_km', e.target.value)}
                    disabled={set.done}
                    className="min-w-0 w-full bg-stone-100 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400 disabled:opacity-50"
                  />
                </>
              ) : (
                <>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={ex.targetReps.replace(/\D/g, '') || '8'}
                    value={set.reps || ''}
                    onChange={(e) => updateSet(si, 'reps', e.target.value)}
                    disabled={set.done}
                    className="min-w-0 w-full bg-stone-100 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400 disabled:opacity-50"
                  />
                  {showWeight && (
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder={previousSets[ex.name]?.[si]?.weight_kg != null
                        ? String(toDisplay(previousSets[ex.name]![si]!.weight_kg!))
                        : 'Valfritt'}
                      value={set.weight_kg != null ? toDisplay(set.weight_kg) : ''}
                      onChange={(e) => updateSet(si, 'weight_kg', e.target.value)}
                      disabled={set.done}
                      className="min-w-0 w-full bg-stone-100 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400 disabled:opacity-50"
                    />
                  )}
                </>
              )}
              <button
                onClick={() => markSetDone(si)}
                disabled={set.done || si !== nextSetIndex}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  set.done
                    ? 'bg-forest-700'
                    : si === nextSetIndex
                    ? 'bg-forest-700 active:bg-forest-700'
                    : 'bg-stone-200'
                }`}
              >
                <CheckIcon className="w-4 h-4 stroke-white" />
              </button>
            </div>
            )
          })}
        </div>

        {/* Progress */}
        <p className="text-xs text-stone-400 text-center mb-1">
          {doneSets}/{totalSets} set · {ex.name}
        </p>
        <p className="text-xs text-stone-500 text-center mb-2">
          {workoutDoneSets}/{workoutTotalSets} set i hela passet
        </p>
        <div className="w-full bg-stone-200 rounded-full h-1.5 mb-6">
          <div
            className="bg-forest-700 h-1.5 rounded-full transition-all"
            style={{ width: `${workoutTotalSets > 0 ? (workoutDoneSets / workoutTotalSets) * 100 : 0}%` }}
          />
        </div>

        {workoutComplete && (
          <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4 mb-4 text-center">
            <p className="font-bold text-forest-800">Alla set klara!</p>
            <p className="text-sm text-forest-600 mt-1">Tryck på knappen nedan för att spara passet.</p>
          </div>
        )}

        {/* Next exercise */}
        {nextIncompleteEx && !workoutComplete && (
          <div className="flex items-center gap-3 bg-white rounded-xl border border-stone-100 p-3 mb-4">
            <div className="text-stone-400 text-xs">Nästa övning</div>
            <div className="font-semibold text-sm text-stone-700">{nextIncompleteEx.name}</div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-5 pb-8 bg-white border-t border-stone-100 pt-4 space-y-3">
        {/* Superset toggle */}
        {workout.currentExerciseIndex < workout.exercises.length - 1 && (
          <button
            onClick={() => {
              workoutStore.update((s) => {
                const nextIdx = s.currentExerciseIndex + 1
                const cur = s.exercises[s.currentExerciseIndex]
                const next = s.exercises[nextIdx]
                if (!cur || !next) return s
                const isSuperset = cur.supersetGroup !== undefined
                const newGroup = isSuperset ? undefined : s.currentExerciseIndex
                return {
                  ...s,
                  exercises: s.exercises.map((e, i) =>
                    i === s.currentExerciseIndex || i === nextIdx
                      ? { ...e, supersetGroup: newGroup }
                      : e
                  ),
                }
              })
            }}
            className={`w-full py-2.5 rounded-2xl text-sm font-medium border transition-colors ${
              ex.supersetGroup !== undefined
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : 'bg-white border-stone-200 text-stone-500'
            }`}
          >
            <ZapIcon className="w-3.5 h-3.5 inline mr-1" />
            {ex.supersetGroup !== undefined ? 'Superset aktivt — tryck för att ta bort' : 'Markera som superset med nästa övning'}
          </button>
        )}
        {workoutComplete ? (
          <button
            onClick={finishWorkout}
            disabled={saving}
            className="w-full bg-forest-700 text-white font-bold py-4 rounded-2xl disabled:opacity-60"
          >
            {saving ? 'Sparar…' : 'Avsluta pass ✓'}
          </button>
        ) : currentExerciseComplete && nextIncompleteIndex !== null ? (
          <button
            onClick={() => goToExerciseIndex(nextIncompleteIndex)}
            className="w-full bg-forest-700 text-white font-bold py-4 rounded-2xl"
          >
            Nästa övning →
          </button>
        ) : null}
        {workoutDoneSets > 0 && !workoutComplete && (
          <button
            onClick={finishWorkout}
            disabled={saving}
            className="w-full bg-white text-forest-700 font-semibold py-3 rounded-2xl border border-forest-200 disabled:opacity-60"
          >
            {saving ? 'Sparar…' : `Spara & avsluta (${workoutDoneSets}/${workoutTotalSets} set)`}
          </button>
        )}
      </div>
    </div>
  )
}
