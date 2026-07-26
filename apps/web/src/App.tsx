import { useEffect, useState, type ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, whenAuthReconciled } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { TabLayout } from './components/TabLayout'
import { BillingGate } from './components/BillingGate'
import { ActiveWorkout } from './pages/training/ActiveWorkout'
import { PlanPage } from './pages/PlanPage'
import { Toaster } from './components/ui/Toaster'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useNotificationScheduler } from './hooks/useNotificationScheduler'
import { useSessionsSync } from './hooks/useSessionsSync'
import { flushLocalWater } from './lib/waterStore'
import { WeeklySessionsProvider } from './contexts/WeeklySessionsContext'
import { api } from './lib/api'
import { parseMockPlanId } from './lib/mockPlan'

/**
 * Redirect a freshly-authenticated user with no profile to onboarding. Without
 * this a new user lands on /hem and onboarding only ever triggered as a side
 * effect of visiting Träning. Runs once per app entry; a transient profile-fetch
 * failure lets the user through (no redirect loop). Skips the DEV mock-plan path.
 */
function RequireProfile({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'ok' | 'missing'>('checking')

  useEffect(() => {
    const storedId = sessionStorage.getItem('formplan_plan_id')
    if (import.meta.env.DEV && storedId && parseMockPlanId(storedId)) {
      setState('ok')
      return
    }
    let cancelled = false
    api
      .getProfile()
      .then(({ profile }) => {
        if (!cancelled) setState(profile ? 'ok' : 'missing')
      })
      .catch(() => {
        // Network / server error: don't trap the user in an onboarding loop.
        if (!cancelled) setState('ok')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (state === 'missing') return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  const { user, loading } = useAuth()
  useNotificationScheduler()
  useSessionsSync()
  // Push any water logged offline to the server on app start (flush-on-reconnect).
  // Wait for the session to be reconciled first, so a pending offline row from a
  // previous account can't be POSTed before the uid-guard purge clears it.
  useEffect(() => {
    whenAuthReconciled.then(() => flushLocalWater()).catch(() => {})
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Toaster />
      <WeeklySessionsProvider>
      <BillingGate user={user}>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/hem" replace /> : <AuthPage />} />
        <Route path="/onboarding" element={user ? <OnboardingPage /> : <Navigate to="/auth" replace />} />
        {/* Plan generation/preview is full-screen, outside the tab layout */}
        <Route
          path="/plan/:id"
          element={user ? <PlanPage /> : <Navigate to="/auth" replace />}
        />
        {/* Active workout is full-screen, outside tab layout */}
        <Route
          path="/workout/:workoutId/active"
          element={user ? <ActiveWorkout /> : <Navigate to="/auth" replace />}
        />
        {/* Everything else lives inside the tab shell */}
        <Route
          path="/*"
          element={user ? <RequireProfile><TabLayout /></RequireProfile> : <Navigate to="/auth" replace />}
        />
      </Routes>
      </BillingGate>
      </WeeklySessionsProvider>
    </ErrorBoundary>
  )
}
