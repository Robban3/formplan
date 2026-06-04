import { useSyncExternalStore } from 'react'
import { workoutStore } from '../store/workoutStore'

export function useWorkoutStore() {
  return useSyncExternalStore(workoutStore.subscribe, workoutStore.get)
}
