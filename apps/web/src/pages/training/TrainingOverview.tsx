import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { deriveDifficulty } from '../../lib/derive'
import { useWeeklySessions } from '../../contexts/WeeklySessionsContext'
import { toast } from '../../lib/toast'
import { toastIfNotNetwork } from '../../lib/errors'
import { PlusIcon, DumbbellIcon, PlayIcon } from '../../components/ui/Icons'
import { WorkoutHero } from '../../components/training/WorkoutHero'
import { useWorkoutStore } from '../../hooks/useWorkoutStore'
import { useLoadTimeout } from '../../hooks/useLoadTimeout'
import { getTrainingStreak, getLongestStreak } from '../../lib/streakStore'
import { loadActivePlan, type WorkoutPlanDay } from '../../lib/planLoader'
import { parseMockPlanId } from '../../lib/mockPlan'
import { ExerciseVideo } from '../../components/training/ExerciseVideo'

type WorkoutDay = WorkoutPlanDay

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
  const thisWeekDone = useWeeklySessions()
  const [isMock, setIsMock] = useState(false)
  const streak = getTrainingStreak()
  const longestStreak = getLongestStreak()

  const today = todayWeekday()
  const workoutDays = days.filter((d) => d.type === 'workout')
  const totalWeek = workoutDays.length

  useEffect(() => {
    loadPlan()
  }, [])

  useLoadTimeout(setLoading)

  async function loadPlan() {
    try {
      const storedId = sessionStorage.getItem('formplan_plan_id')
      const hasMockSession = !!storedId && !!parseMockPlanId(storedId)

      let profileData: unknown = null
      try {
        const { profile } = await api.getProfile()
        profileData = profile
        if (!profile && !hasMockSession) {
          navigate('/onboarding')
          return
        }
      } catch {
        if (!hasMockSession) {
          navigate('/onboarding')
          return
        }
      }

      const loaded = await loadActivePlan(profileData)
      if (loaded) {
        setPlan(loaded.plan as Plan)
        setDays(loaded.workoutDays)
        setIsMock(loaded.isMock)

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
      toastIfNotNetwork(e, toast.error)
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
      <WorkoutHero
        title="Träning"
        subtitle={
          plan
            ? `${thisWeekDone} av ${totalWeek} pass denna vecka${isMock ? ' · testdata' : ''}`
            : 'Ditt träningsschema'
        }
      />

      <div className="px-5 bg-white border-b border-stone-100">
        <div className="flex gap-5">
          {(['pass', 'program', 'ovningar'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 pt-1 text-sm font-medium capitalize transition-colors ${
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

          {/* Weekly ring + streak */}
          {plan && (
            <div className="bg-stone-100 rounded-2xl p-4 flex items-center gap-4">
              <WeeklyRing done={thisWeekDone} total={totalWeek} />
              <div className="flex-1">
                <p className="text-xs text-stone-500">Denna vecka</p>
                <p className="font-bold text-stone-900 text-lg">{thisWeekDone} av {totalWeek} pass</p>
              </div>
              {streak > 0 && (
                <div className="flex flex-col items-center bg-amber-50 rounded-xl px-3 py-2">
                  <span className="text-lg font-bold text-amber-500">{streak}</span>
                  <span className="text-[9px] text-amber-400">dag streak</span>
                  {longestStreak > streak && (
                    <span className="text-[8px] text-stone-400">rekord: {longestStreak}</span>
                  )}
                </div>
              )}
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
            <div className="text-center py-10">
              <div className="flex justify-center mb-3">
                <DumbbellIcon className="w-12 h-12 stroke-stone-300" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Inget schema ännu</h2>
              <p className="text-stone-400 text-sm mb-6">Generera ett AI-schema eller bygg ett eget pass.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  {generating ? 'Genererar...' : 'Generera schema'}
                </button>
                <button
                  onClick={() => navigate('/traning/egna')}
                  className="border border-stone-200 text-stone-600 font-semibold px-5 py-3 rounded-xl flex items-center gap-2 hover:border-forest-400 hover:text-forest-600 transition-colors"
                >
                  <DumbbellIcon className="w-4 h-4" />
                  Egna pass
                </button>
              </div>
            </div>
          )}

          {/* Always show quick-access buttons at bottom */}
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 border border-stone-200 rounded-xl py-3 text-sm text-stone-500 hover:border-forest-400 hover:text-forest-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {generating ? 'Genererar...' : 'AI-schema'}
            </button>
            <button
              onClick={() => navigate('/traning/egna')}
              className="flex-1 flex items-center justify-center gap-2 border border-stone-200 rounded-xl py-3 text-sm text-stone-500 hover:border-forest-400 hover:text-forest-600 transition-colors"
            >
              <DumbbellIcon className="w-4 h-4" />
              Egna pass
            </button>
          </div>
        </div>
      )}

      {tab === 'program' && (
        <div className="px-5 mt-4">
          {workoutDays.length === 0 ? (
            <p className="text-center text-stone-400 mt-12">Generera ett schema för att se programöversikten.</p>
          ) : (
            <div className="space-y-3">
              {workoutDays.map((day) => (
                <div key={day.id} className="bg-white rounded-2xl border border-stone-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs text-stone-400 font-medium">{WEEKDAYS[(day.weekday ?? 1) - 1]}</span>
                      <p className="font-semibold text-stone-900">{day.content.name}</p>
                    </div>
                    <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-lg">
                      {day.content.duration_minutes} min
                    </span>
                  </div>
                  <ProgramExerciseList exercises={day.content.exercises} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'ovningar' && (
        <ExerciseLibrary days={workoutDays} />
      )}
    </div>
  )
}

function ProgramExerciseList({
  exercises,
}: {
  exercises: { name: string; sets: number; reps: string }[]
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="divide-y divide-stone-50">
      {exercises.map((ex, i) => {
        const isOpen = openIndex === i

        return (
          <div key={i} className="py-2.5 first:pt-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left"
              >
                <span className="text-sm text-stone-700">{ex.name}</span>
                <span className="text-xs text-stone-400 shrink-0">{ex.sets} × {ex.reps}</span>
              </button>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-label={`Teknikguide: ${ex.name}`}
                className="shrink-0"
              >
                <ExerciseVideo exerciseName={ex.name} variant="row" />
              </button>
            </div>
            {isOpen && (
              <div className="mt-2">
                <ExerciseVideo exerciseName={ex.name} variant="card" />
              </div>
            )}
          </div>
        )
      })}
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
    Lätt: 'bg-teal-100 text-teal-700',
    Medel: 'bg-amber-100 text-amber-700',
    Hög: 'bg-red-100 text-red-700',
  }
  const diffLabel = deriveDifficulty(day.content)

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

function ExerciseLibrary({ days }: { days: WorkoutDay[] }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  // Deduplicate exercises across workout days and enrich with which day they appear in.
  const all = days.flatMap((day) =>
    day.content.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      dayName: day.content.name,
      focus: day.content.focus,
    }))
  )

  const unique = Array.from(
    all
      .reduce((map, ex) => {
        if (!map.has(ex.name)) map.set(ex.name, ex)
        return map
      }, new Map<string, typeof all[number]>())
      .values()
  )

  const filtered = query.trim()
    ? unique.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    : unique

  if (days.length === 0) {
    return (
      <div className="px-5 mt-12 text-center text-stone-400">
        <p>Generera ett schema för att se övningsbiblioteket.</p>
      </div>
    )
  }

  return (
    <div className="px-5 mt-4 space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Sök övning…"
        className="w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-400 text-sm"
      />
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {filtered.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-6">Inga träffar.</p>
        )}
        {filtered.map((ex, i) => (
          <div key={ex.name} className={i > 0 ? 'border-t border-stone-50' : ''}>
            <button
              type="button"
              onClick={() => setExpanded(expanded === ex.name ? null : ex.name)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-800">{ex.name}</p>
                <p className="text-xs text-stone-400">{ex.dayName} · {ex.focus}</p>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className="text-xs text-stone-500">{ex.sets} × {ex.reps}</span>
                <span className="flex items-center gap-1 text-xs font-medium text-forest-600">
                  <PlayIcon className="w-3.5 h-3.5" />
                  {expanded === ex.name ? 'Stäng' : 'Video'}
                </span>
              </div>
            </button>
            {expanded === ex.name && (
              <div className="px-4 pb-3">
                <ExerciseVideo exerciseName={ex.name} variant="card" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
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
