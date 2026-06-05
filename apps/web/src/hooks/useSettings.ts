import { useSyncExternalStore } from 'react'
import { settingsStore } from '../lib/settings'

export function useSettings() {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.getSnapshot, settingsStore.getSnapshot)
}
