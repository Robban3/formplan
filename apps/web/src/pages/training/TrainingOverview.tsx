import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { PlusIcon } from '../../components/ui/Icons'
import { useWorkoutStore } from '../../hooks/useWorkoutStore'

interface WorkoutDay {
  id: string
  weekday: number
  type: 'workout' | 'rest' | 'nutrition'
  content: {
    name: string
    focus: string
    duration_minutes: number
    exercises: { name: string; sets: number; reps: string }[]
  }
}

interface Plan {
  id: string
  status: string
  created_at: string
}

const WEEKDAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
const SHORT = ['M', 'Ti', 'O', 'To', 'F', 'L', 'S']

function todayWeekday() {
  const d = new Date().getDay()
  return d === 0 ? 7 : d // 1=Mon … 7=Sun
}

export function TrainingOverview() {
  const navigate = useNavigate()
  const activeWorkout = useWorkoutStore()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [days, setDays] = useState<WorkoutDay[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [tab, setTab] = useState<'pass' | 'program' | 'ovningar'>('pass')

  const today = todayWeekday()
  const workoutDays = days.filter((d) => d.type === 'workout')
  const thisWeekDone = 2 // TODO: track from logs
  const totalWeek = workoutDays.length

  useEffect(() => {
    loadPlan()
  }, [])

  async function loadPlan() {
    try {
      const profile = await api.getProfile()
      if (!profile.profile) {
        navigate('/onboarding')
        return
      }
      // TODO: fetch latest plan id from API list endpoint
      // For now try session storage
      const savedId = sessionStorage.getItem('formplan_plan_id')
      if (savedId) {
        const { plan, days } = await api.getPlan(savedId)
        setPlan(plan as Plan)
        setDays((days as WorkoutDay[]).filter((d) => d.type === 'workout'))
      }
    } catch {
      // no plan yet
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const { plan_id } = await api.generatePlan()
      sessionStorage.setItem('formplan_plan_id', plan_id)
      // poll until ready
      let attempts = 0
      while (attempts < 20) {
        await new Promise((r) => setTimeout(r, 2000))
        const { plan, days } = await api.getPlan(plan_id)
        const p = plan as Plan
        if (p.status === 'ready') {
          setPlan(p)
          setDays((days as WorkoutDay[]).filter((d) => d.type === 'workout'))
          break
        }
        if (p.status === 'error') break
        attempts++
      }
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white">
        <h1 className="text-2xl font-bold text-stone-900">Träning</h1>

        {/* Sub-tabs */}
        <div className="flex gap-5 mt-4 border-b border-stone-100">
          {(['pass', 'program', 'ovningar'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'text-forest-600 border-b-2 border-forest-600'
                  : 'text-stone-400'
              }`}
            >
              {t === 'pass' ? 'Pass' : t === 'program' ? 'Program' : 'Övningar'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'pass' && (
        <div className="px-5 mt-4 space-y-4">
          {/* Active workout banner */}
          {activeWorkout && (
            <button
              onClick={() => navigate(`/workout/${activeWorkout.planDayId}/active`)}
              className="w-full flex items-center justify-between bg-forest-600 text-white rounded-2xl px-4 py-3"
            >
              <div className="text-left">
                <p className="text-xs text-forest-200">Pågående pass</p>
                <p className="font-semibold">{activeWorkout.workoutName}</p>
              </div>
              <span className="text-sm font-mono bg-forest-700 px-3 py-1 rounded-lg">
                Återgå →
              </span>
            </button>
          )}

          {/* Weekly ring */}
          {plan && (
            <div className="bg-stone-100 rounded-2xl p-4 flex items-center gap-4">
              <WeeklyRing done={thisWeekDone} total={totalWeek} />
              <div>
                <p className="text-xs text-stone-500">Denna vecka</p>
                <p className="font-bold text-stone-900 text-lg">{thisWeekDone} av {totalWeek} pass</p>
              </div>
            </div>
          )}

          {/* Weekday dots */}
          {plan && (
            <div className="flex gap-1">
              {SHORT.map((s, i) => {
                const wd = i + 1
                const hasWorkout = workoutDays.some((d) => d.weekday === wd)
                const isToday = wd === today
                return (
                  <div
                    key={wd}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium ${
                      isToday ? 'bg-forest-600 text-white' : 'text-stone-400'
                    }`}
                  >
                    {s}
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      hasWorkout
                        ? isToday ? 'bg-white' : 'bg-forest-600'
                        : 'bg-transparent'
                    }`} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Workout list */}
          {plan ? (
            <div className="space-y-3">
              {workoutDays.map((day) => (
                <WorkoutCard
                  key={day.id}
                  day={day}
                  isToday={day.weekday === today}
                  onClick={() => navigate(`/traning/${day.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🏋️</div>
              <h2 className="text-lg font-semibold mb-1">Inget schema ännu</h2>
              <p className="text-stone-400 text-sm mb-6">Generera ett personligt träningsschema med AI.</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 mx-auto transition-colors"
              >
                <PlusIcon className="w-4 h-4 stroke-white" />
                {generating ? 'Genererar...' : 'Skapa nytt pass'}
              </button>
            </div>
          )}

          {plan && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 border border-stone-200 rounded-xl py-3 text-sm text-stone-500 hover:border-forest-400 hover:text-forest-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {generating ? 'Genererar...' : 'Skapa nytt pass'}
            </button>
          )}
        </div>
      )}

      {tab === 'program' && (
        <div className="px-5 mt-8 text-center text-stone-400">
          <p>Program-vyn kommer snart.</p>
        </div>
      )}

      {tab === 'ovningar' && (
        <div className="px-5 mt-8 text-center text-stone-400">
          <p>Övningsbibliotek kommer snart.</p>
        </div>
      )}
    </div>
  )
}

function WorkoutCard({
  day,
  isToday,
  onClick,
}: {
  day: WorkoutDay
  isToday: boolean
  onClick: () => void
}) {
  const diff: Record<string, string> = {
    Lätt: 'bg-emerald-100 text-emerald-700',
    Medel: 'bg-amber-100 text-amber-700',
    Hög: 'bg-red-100 text-red-700',
  }
  const diffLabel = 'Medel' // TODO: derive from plan

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-stone-100 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isToday && (
              <span className="text-xs bg-forest-600 text-white px-2 py-0.5 rounded-full font-medium">
                Idag
              </span>
            )}
            <span className="text-xs text-stone-400">
              {WEEKDAYS[(day.weekday ?? 1) - 1]}
            </span>
          </div>
          <p className="font-semibold text-stone-900 truncate">{day.content.name}</p>
          <p className="text-sm text-stone-400 mt-0.5">
            {day.content.duration_minutes} min · {day.content.focus}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diff[diffLabel] ?? diff['Medel']}`}>
            {diffLabel}
          </span>
          {isToday && (
            <span className="text-xs text-forest-600 font-medium">Starta →</span>
          )}
        </div>
      </div>

      {/* Exercise preview */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {day.content.exercises.slice(0, 3).map((ex, i) => (
          <span key={i} className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-lg">
            {ex.name}
          </span>
        ))}
        {day.content.exercises.length > 3 && (
          <span className="text-xs bg-stone-100 text-stone-400 px-2 py-1 rounded-lg">
            +{day.content.exercises.length - 3} till
          </span>
        )}
      </div>
    </button>
  )
}

function WeeklyRing({ done, total }: { done: number; total: number }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#e7e5e4" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r}
        fill="none"
        stroke="#1e6e42"
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1c1917">
        {done}/{total}
      </text>
    </svg>
  )
}
