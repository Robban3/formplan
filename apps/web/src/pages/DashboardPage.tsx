import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api, type PlanSummary as PlanRow } from '../lib/api'
import { toast } from '../lib/toast'
import { toastIfNotNetwork } from '../lib/errors'

export function DashboardPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    try {
      // Quick check — if no profile yet, redirect to onboarding
      const profile = await api.getProfile()
      if (!profile.profile) {
        navigate('/onboarding')
        return
      }
      const { plans } = await api.listPlans()
      setPlans(plans)
    } catch {
      navigate('/onboarding')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const { plan_id } = await api.generatePlan()
      navigate(`/plan/${plan_id}`)
    } catch (e) {
      toastIfNotNetwork(e, toast.error)
      setGenerating(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-slate-950 text-slate-100">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">FormPlan</h1>
          <button onClick={handleSignOut} className="text-slate-400 hover:text-slate-200 text-sm">
            Logga ut
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">💪</div>
            <h2 className="text-xl font-semibold mb-2">Redo att börja?</h2>
            <p className="text-slate-400 mb-8">Generera ditt personliga tränings- och kostschema.</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold px-8 py-3 rounded-xl transition-colors"
            >
              {generating ? 'Genererar...' : 'Generera schema ✨'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => navigate(`/plan/${plan.id}`)}
                className="w-full flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-500 transition-all"
              >
                <div className="text-left">
                  <p className="font-medium">Schema</p>
                  <p className="text-slate-400 text-sm">{new Date(plan.created_at).toLocaleDateString('sv-SE')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  plan.status === 'ready' ? 'bg-brand-900/40 text-brand-400' :
                  plan.status === 'generating' ? 'bg-amber-900/40 text-amber-400' :
                  'bg-red-900/40 text-red-400'
                }`}>
                  {plan.status === 'ready' ? 'Klart' : plan.status === 'generating' ? 'Genererar...' : 'Fel'}
                </span>
              </button>
            ))}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 border border-slate-700 hover:border-brand-500 rounded-xl text-slate-400 hover:text-brand-400 transition-all text-sm"
            >
              + Nytt schema
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
