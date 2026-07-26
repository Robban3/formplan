import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { clearLocalUserData } from '../lib/localData'
import { workoutStore } from '../store/workoutStore'

const LAST_UID_KEY = 'formplan_last_uid'

/**
 * Resolves once the initial session has been reconciled (any account-switch
 * purge has run). Offline flushers (`flushLocalWater`, `flushLocalSessions`)
 * must await this before POSTing — otherwise user A's still-pending offline
 * rows could be sent into user B's account before the uid-guard purge runs.
 */
let markReconciled!: () => void
export const whenAuthReconciled = new Promise<void>((resolve) => {
  markReconciled = resolve
})

/**
 * Purge the previous user's locally cached data whenever a *different* user is
 * signed in — a safety net for the case where sign-out cleanup was missed (e.g.
 * the app was reopened already authenticated as someone else). No-op when the
 * same user returns or on the very first sign-in on this device.
 */
function reconcileSignedInUser(userId: string | undefined) {
  if (!userId) return
  try {
    const last = localStorage.getItem(LAST_UID_KEY)
    if (last && last !== userId) {
      clearLocalUserData()
      // Storage is cleared, but the workout store's in-memory `_state` was read
      // at module-eval and would otherwise survive the account switch.
      workoutStore.reset()
    }
    if (last !== userId) localStorage.setItem(LAST_UID_KEY, userId)
  } catch {
    /* storage blocked */
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      reconcileSignedInUser(data.session?.user?.id)
      markReconciled()
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      reconcileSignedInUser(session?.user?.id)
      markReconciled()
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { user, loading }
}
