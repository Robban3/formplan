import { createContext, useContext, type ReactNode } from 'react'
import { useWeeklySessionCount } from '../hooks/useWeeklySessionCount'

const WeeklySessionsContext = createContext(0)

export function WeeklySessionsProvider({ children }: { children: ReactNode }) {
  const count = useWeeklySessionCount()
  return (
    <WeeklySessionsContext.Provider value={count}>
      {children}
    </WeeklySessionsContext.Provider>
  )
}

export function useWeeklySessions(): number {
  return useContext(WeeklySessionsContext)
}
