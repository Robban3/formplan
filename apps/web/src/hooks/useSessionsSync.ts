import { useEffect } from 'react'
import { workoutApi } from '../lib/workoutApi'
import { syncSessionsFromApi } from '../lib/workoutSessionStore'

/**
 * On mount: first pushes any offline-logged sessions (`local-…` ids) to the
 * API, then fetches the server list and syncs it into the local store so that
 * Home and Analytics always reflect the true session count.
 */
export function useSessionsSync() {
  useEffect(() => {
    workoutApi
      .flushLocalSessions()
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
