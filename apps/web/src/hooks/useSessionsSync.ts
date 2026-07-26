import { useEffect } from 'react'
import { workoutApi } from '../lib/workoutApi'
import { syncSessionsFromApi } from '../lib/workoutSessionStore'
import { whenAuthReconciled } from './useAuth'

/**
 * On mount: first pushes any offline-logged sessions (`local-…` ids) to the
 * API, then fetches the server list and syncs it into the local store so that
 * Home and Analytics always reflect the true session count.
 */
export function useSessionsSync() {
  useEffect(() => {
    // Wait for session reconciliation (account-switch purge) before flushing —
    // otherwise a previous account's pending offline session could POST into the
    // newly signed-in account.
    whenAuthReconciled
      .then(() => workoutApi.flushLocalSessions())
      .catch(() => {})
      .then(() => workoutApi.getSessions())
      .then(({ sessions }) => {
        if (sessions && sessions.length > 0) {
          syncSessionsFromApi(sessions)
        }
      })
      .catch(() => {
        // API not available — local store is used as-is
      })
  }, [])
}
