import { useEffect, useReducer } from 'react'
import { useLocation } from 'react-router-dom'
import { getWeeklySessionCount, subscribeSessions } from '../lib/workoutSessionStore'

/** Läser passantal direkt från lagring vid varje render. */
export function useWeeklySessionCount(): number {
  const location = useLocation()
  const [, refresh] = useReducer((n: number) => n + 1, 0)

  useEffect(() => subscribeSessions(() => refresh()), [])
  useEffect(() => {
    refresh()
  }, [location.pathname])

  return getWeeklySessionCount()
}
