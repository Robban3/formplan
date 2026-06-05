// Simple in-memory store for active workout state.
// A full app would use Zustand/Jotai, but this avoids extra deps for now.

export interface SetLog {
  reps: number
  weight_kg: number | null
  done: boolean
}

export interface ExerciseLog {
  name: string
  targetSets: number
  targetReps: string
  restSeconds: number
  sets: SetLog[]
}

export interface ActiveWorkoutState {
  planDayId: string
  workoutName: string
  startedAt: number // Date.now()
  exercises: ExerciseLog[]
  currentExerciseIndex: number
}

const ACTIVE_KEY = 'formplan_active_workout'

function restore(): ActiveWorkoutState | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ActiveWorkoutState
  } catch {
    return null
  }
}

function persist(state: ActiveWorkoutState | null) {
  try {
    if (state) sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(state))
    else sessionStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* sessionStorage blocked */
  }
}

let _state: ActiveWorkoutState | null = restore()
const _listeners = new Set<() => void>()

export const workoutStore = {
  get(): ActiveWorkoutState | null {
    return _state
  },
  start(state: ActiveWorkoutState) {
    _state = state
    persist(_state)
    _listeners.forEach((l) => l())
  },
  update(updater: (s: ActiveWorkoutState) => ActiveWorkoutState) {
    if (!_state) return
    _state = updater(_state)
    persist(_state)
    _listeners.forEach((l) => l())
  },
  finish() {
    _state = null
    persist(null)
    _listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    _listeners.add(listener)
    return () => _listeners.delete(listener)
  },
}
