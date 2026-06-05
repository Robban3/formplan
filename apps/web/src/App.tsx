import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { TabLayout } from './components/TabLayout'
import { ActiveWorkout } from './pages/training/ActiveWorkout'
import { PlanPage } from './pages/PlanPage'
import { Toaster } from './components/ui/Toaster'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  const { user, loading } = useAuth()

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
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
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
        <Route path="/*" element={user ? <TabLayout /> : <Navigate to="/auth" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
