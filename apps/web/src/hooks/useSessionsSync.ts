import { useEffect } from 'react'
import { workoutApi } from '../lib/workoutApi'
import { syncSessionsFromApi } from '../lib/workoutSessionStore'

/**
 * Fetches sessions from the API once on mount and syncs them into the local
 * store so that Home and Analytics always reflect the true session count,
 * even if other components haven't fetched yet.
 */
export function useSessionsSync() {
  useEffect(() => {
    workoutApi
      .getSessions()
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
