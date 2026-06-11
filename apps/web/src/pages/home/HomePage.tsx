import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../hooks/useSettings'
import { useWorkoutStore } from '../../hooks/useWorkoutStore'
import { useLoadTimeout } from '../../hooks/useLoadTimeout'
import { api } from '../../lib/api'
import { nutritionApi, type FoodLogEntry, type MealSlot } from '../../lib/nutritionApi'
import { dateKey, deriveDifficulty, isoWeekday } from '../../lib/derive'
import { loadActivePlan } from '../../lib/planLoader'
import { useWeeklySessions } from '../../contexts/WeeklySessionsContext'
import { getTrainingStreak } from '../../lib/streakStore'
import { getLocalSessions } from '../../lib/workoutSessionStore'
import { loadGoals, effectiveProgress } from '../GoalsPage'
import { addLocalWater, getLocalWater } from '../../lib/waterStore'
import { toast } from '../../lib/toast'
import {
  DumbbellIcon,
  LeafIcon,
  BarChartIcon,
  TargetIcon,
  ChevronRightIcon,
  DropletIcon,
  PlayIcon,
} from '../../components/ui/Icons'
import { WorkoutHero } from '../../components/training/WorkoutHero'
import type { ComponentType } from 'react'

const STEPS_GOAL = 10_000
const MEAL_SLOTS: MealSlot[] = ['frukost', 'lunch', 'mellanmar', 'middag']

const MEAL_LABELS: Record<MealSlot, string> = {
  frukost: 'Frukost',
  lunch: 'Lunch',
  middag: 'Middag',
  mellanmar: 'Mellanmål',
}

type QuickLink = {
  Icon: ComponentType<{ className?: string }>
  label: string
  sub: string
  path: string
  iconBg: string
  iconStroke: string
}

const QUICK_LINKS: QuickLink[] = [
  { Icon: DumbbellIcon, label: 'Träning', sub: 'Schema & pass', path: '/traning', iconBg: 'bg-forest-50', iconStroke: 'stroke-forest-600' },
  { Icon: LeafIcon, label: 'Kost', sub: 'Logga måltider', path: '/kost', iconBg: 'bg-sky-50', iconStroke: 'stroke-sky-500' },
  { Icon: BarChartIcon, label: 'Analys', sub: 'Statistik & trender', path: '/analys', iconBg: 'bg-amber-50', iconStroke: 'stroke-amber-500' },
  { Icon: TargetIcon, label: 'Mina mål', sub: 'Följ dina mål', path: '/mer/mina-mal', iconBg: 'bg-purple-50', iconStroke: 'stroke-purple-500' },
]

const DIFF_STYLES: Record<string, string> = {
  Lätt: 'bg-teal-100 text-teal-700',
  Medel: 'bg-amber-100 text-amber-700',
  Hög: 'bg-red-100 text-red-700',
}

function todayLabel(): string {
  return new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

interface WorkoutDay {
  id: string
  weekday: number
  type: 'workout' | 'rest' | 'nutrition'
  content: {
    name: string
    focus: string
    duration_minutes: number
    exercises: { name: string }[]
  }
}

function MiniRing({ value, goal, size = 52 }: { value: number; goal: number; size?: number }) {
  const r = size * 0.36
  const circ = 2 * Math.PI * r
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e7e5e4" strokeWidth="3.5" />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke="#1e6e42"
        strokeWidth="3.5"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
    </svg>
  )
}

function StatCard({
  label,
  value,
  goal,
  unit,
  onClick,
}: {
  label: string
  value: number
  goal: number
  unit: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-stone-100 p-3 flex flex-col items-center text-center active:scale-[0.97] transition-transform"
    >
      <MiniRing value={value} goal={goal} />
      <p className="text-[10px] text-stone-400 mt-2">{label}</p>
      <p className="text-sm font-bold text-stone-900 mt-0.5">
        {value.toLocaleString('sv-SE')}
        <span className="text-stone-400 font-normal">/{goal.toLocaleString('sv-SE')}</span>
      </p>
      <p className="text-[10px] text-stone-400">{unit}</p>
    </button>
  )
}

function WeeklyRing({ done, total, size = 56 }: { done: number; total: number; size?: number }) {
  const r = size * 0.39
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e7e5e4" strokeWidth="4" />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke="#1e6e42"
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text x={cx} y={cx + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1c1917">
        {done}/{total}
      </text>
    </svg>
  )
}

function WeeklyReport({ weeklyDone, weeklyTotal }: { weeklyDone: number; weeklyTotal: number }) {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const weeklySessions = getLocalSessions().filter((s) => new Date(s.completed_at) >= monday)
  const totalVolume = weeklySessions.reduce((s, x) => s + x.total_volume_kg, 0)
  const totalTime = weeklySessions.reduce((s, x) => s + x.duration_seconds, 0)
  const avgTime = weeklySessions.length > 0 ? Math.round(totalTime / weeklySessions.length / 60) : 0

  const weekLabel = monday.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
  const onTrack = weeklyTotal > 0 && weeklyDone >= weeklyTotal
  const pct = weeklyTotal > 0 ? Math.round((weeklyDone / weeklyTotal) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Veckans rapport</p>
          <p className="text-[10px] text-stone-300">v. från {weekLabel}</p>
        </div>
        {onTrack && <span className="text-xs bg-forest-50 text-forest-700 font-semibold px-2 py-0.5 rounded-full border border-forest-100">Mål uppnått!</span>}
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xl font-bold text-stone-900">{weeklyDone}</p>
          <p className="text-[10px] text-stone-400">pass{weeklyTotal > 0 ? ` av ${weeklyTotal}` : ''}</p>
          {weeklyTotal > 0 && <p className="text-[9px] text-forest-600 font-medium">{pct}%</p>}
        </div>
        <div>
          <p className="text-xl font-bold text-stone-900">{totalVolume > 0 ? Math.round(totalVolume / 1000 * 10) / 10 : 0}</p>
          <p className="text-[10px] text-stone-400">ton lyft</p>
        </div>
        <div>
          <p className="text-xl font-bold text-stone-900">{avgTime}</p>
          <p className="text-[10px] text-stone-400">min/pass</p>
        </div>
      </div>
    </div>
  )
}

function loadActiveGoalsCount(): number {
  try {
    const raw = JSON.parse(localStorage.getItem('formplan_goals') ?? '[]') as { done?: boolean }[]
    return raw.filter((g) => !g.done).length
  } catch {
    return 0
  }
}

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const settings = useSettings()
  const activeWorkout = useWorkoutStore()
  const [loading, setLoading] = useState(true)
  const [todayWorkout, setTodayWorkout] = useState<WorkoutDay | null>(null)
  const [planLoaded, setPlanLoaded] = useState(false)
  const weeklyDone = useWeeklySessions()
  const [weeklyTotal, setWeeklyTotal] = useState(0)
  const [entries, setEntries] = useState<FoodLogEntry[]>([])
  const [eatenKcal, setEatenKcal] = useState(0)
  const [eatenProtein, setEatenProtein] = useState(0)
  const [kcalGoal, setKcalGoal] = useState(settings.calorie_goal)
  const [proteinGoal, setProteinGoal] = useState(settings.protein_goal_g)
  const [waterTotal, setWaterTotal] = useState(() => getLocalWater(dateKey()).total_ml)
  const [activeGoals, setActiveGoals] = useState(loadActiveGoalsCount)
  const [topGoals] = useState(() => loadGoals().filter((g) => !g.done).slice(0, 3))
  const [streak] = useState(() => getTrainingStreak())

  const firstName = user?.user_metadata?.['full_name']?.split(' ')[0]
  const greeting = firstName ? `Hej, ${firstName}!` : 'Hej!'
  const today = dateKey()

  useEffect(() => {
    async function load() {
      try {
        const [log, water, profileRes] = await Promise.all([
          nutritionApi.getDailyLog(today).catch(() => null),
          nutritionApi.getWater(today).catch(() => null),
          api.getProfile().catch(() => ({ profile: null })),
        ])

        if (log) {
          setEntries(log.entries)
          setEatenKcal(log.entries.reduce((sum, e) => sum + e.kcal, 0))
          setEatenProtein(log.entries.reduce((sum, e) => sum + e.protein_g, 0))
          setKcalGoal(log.goals.kcal)
          setProteinGoal(log.goals.protein_g)
        }
        if (water) setWaterTotal(water.total_ml)

        const loaded = await loadActivePlan(profileRes.profile)
        setPlanLoaded(!!loaded)
        if (loaded) {
          setWeeklyTotal(loaded.workoutDays.length)
          const todayWd = isoWeekday(new Date())
          setTodayWorkout(loaded.workoutDays.find((d) => d.weekday === todayWd) ?? null)
        } else {
          setWeeklyTotal(0)
          setTodayWorkout(null)
        }
      } catch {
        // Dashboard is best-effort
      } finally {
        setLoading(false)
        setActiveGoals(loadActiveGoalsCount())
      }
    }

    load()
  }, [today])

  useLoadTimeout(setLoading)

  if (loading) {
    return (
      <div className="pb-4">
        <div className="flex items-center justify-center h-32">
          <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="px-5">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide px-1 mb-2">
            Denna vecka
          </p>
          <div className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-3">
            <WeeklyRing done={weeklyDone} total={Math.max(weeklyTotal, 1)} />
            <div>
              <p className="font-bold text-stone-900">{weeklyDone}</p>
              <p className="text-xs text-stone-400">
                av {weeklyTotal > 0 ? weeklyTotal : '—'} pass
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const diffLabel = todayWorkout ? deriveDifficulty(todayWorkout.content) : null
  const loggedMeals = MEAL_SLOTS.filter((slot) => entries.some((e) => e.meal_slot === slot))
  const waterPct = Math.min((waterTotal / settings.water_goal_ml) * 100, 100)

  function handleQuickWater() {
    addLocalWater(today, 250)
    setWaterTotal((prev) => prev + 250)
    toast.success('+250 ml vatten loggat')
  }

  return (
    <div className="pb-4">
      <div className="px-5 pt-header pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{greeting}</h1>
            <p className="text-stone-400 text-sm capitalize mt-0.5">{todayLabel()}</p>
          </div>
          {/* Streak badge */}
          {streak > 0 && (
            <div className="flex flex-col items-center bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 min-w-[56px]">
              <span className="text-xl font-bold text-amber-500">{streak}</span>
              <span className="text-[9px] text-amber-400 font-medium">dag streak</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Dagens översikt */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide px-1 mb-2">
            Dagens översikt
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label="Kalorier"
              value={Math.round(eatenKcal)}
              goal={kcalGoal}
              unit="kcal"
              onClick={() => navigate('/kost')}
            />
            <StatCard
              label="Protein"
              value={Math.round(eatenProtein)}
              goal={proteinGoal}
              unit="g"
              onClick={() => navigate('/kost')}
            />
            <StatCard
              label="Kvar idag"
              value={Math.max(0, kcalGoal - Math.round(eatenKcal))}
              goal={kcalGoal}
              unit="kcal"
              onClick={() => navigate('/kost')}
            />
          </div>
        </div>

        {/* Pågående pass */}
        {activeWorkout && (
          <button
            onClick={() => navigate(`/workout/${activeWorkout.planDayId}/active`)}
            className="w-full flex items-center justify-between bg-forest-700 text-white rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <div className="text-left">
              <p className="text-xs text-forest-200">Pågående pass</p>
              <p className="font-semibold">{activeWorkout.workoutName}</p>
            </div>
            <span className="text-sm font-medium bg-forest-700 px-3 py-1 rounded-lg">
              Fortsätt →
            </span>
          </button>
        )}

        {/* Dagens pass */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide px-1 mb-2">
            Dagens pass
          </p>
          {todayWorkout ? (
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <WorkoutHero
                size="sm"
                title={todayWorkout.content.name}
                subtitle={`${todayWorkout.content.duration_minutes} min · ${todayWorkout.content.focus}`}
                badge={diffLabel ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_STYLES[diffLabel] ?? DIFF_STYLES['Medel']}`}>
                    {diffLabel}
                  </span>
                ) : undefined}
              />
              <div className="px-4 py-3">
                <div className="flex gap-2 flex-wrap">
                  {todayWorkout.content.exercises.slice(0, 3).map((ex, i) => (
                    <span key={i} className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-lg">
                      {ex.name}
                    </span>
                  ))}
                  {todayWorkout.content.exercises.length > 3 && (
                    <span className="text-xs bg-stone-100 text-stone-400 px-2 py-1 rounded-lg">
                      +{todayWorkout.content.exercises.length - 3}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(`/traning/${todayWorkout.id}`)}
                className="w-full flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold py-3.5 transition-colors"
              >
                <PlayIcon className="w-4 h-4 stroke-white" />
                Starta pass
              </button>
            </div>
          ) : !planLoaded ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <p className="font-semibold text-stone-800">Inget schema</p>
              <p className="text-sm text-stone-400 mt-0.5">Välj ett träningsschema för att se dagens pass.</p>
              <button
                onClick={() => navigate('/traning')}
                className="mt-3 text-sm text-forest-600 font-medium"
              >
                Gå till Träning →
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <p className="font-semibold text-stone-800">Vilodag</p>
              <p className="text-sm text-stone-400 mt-0.5">Inget pass schemalagt idag.</p>
              <button
                onClick={() => navigate('/traning')}
                className="mt-3 text-sm text-forest-600 font-medium"
              >
                Se veckoschema →
              </button>
            </div>
          )}
        </div>

        {/* Träning & vatten */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide px-1 mb-2">
            Denna vecka
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/traning')}
              className="bg-white rounded-2xl border border-stone-100 p-4 text-left active:scale-[0.98] transition-transform"
            >
              <p className="text-xs text-stone-400 mb-2">Träning</p>
              <div className="flex items-center gap-3">
                <WeeklyRing done={weeklyDone} total={Math.max(weeklyTotal, 1)} />
                <div>
                  <p className="font-bold text-stone-900">{weeklyDone}</p>
                  <p className="text-xs text-stone-400">
                    av {weeklyTotal > 0 ? weeklyTotal : '—'} pass
                  </p>
                </div>
              </div>
            </button>

            <div className="bg-white rounded-2xl border border-stone-100 p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-stone-400 flex items-center gap-1">
                  <DropletIcon className="w-3.5 h-3.5 stroke-sky-500" />
                  Vatten
                </p>
                <button
                  onClick={handleQuickWater}
                  className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full active:bg-sky-100"
                >
                  +250 ml
                </button>
              </div>
              <p className="text-lg font-bold text-stone-900">
                {(waterTotal / 1000).toLocaleString('sv-SE', { maximumFractionDigits: 1 })} L
              </p>
              <p className="text-xs text-stone-400">av {settings.water_goal_ml / 1000} L</p>
              <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2">
                <div
                  className="bg-sky-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${waterPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Veckorapport */}
        {weeklyDone > 0 && <WeeklyReport weeklyDone={weeklyDone} weeklyTotal={weeklyTotal} />}

        {/* Aktiva mål */}
        {topGoals.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Mina mål</p>
              <button onClick={() => navigate('/mer/mina-mal')} className="text-xs text-forest-600 font-medium">
                Se alla →
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden divide-y divide-stone-50">
              {topGoals.map((goal) => {
                const pct = effectiveProgress(goal)
                return (
                  <button
                    key={goal.id}
                    onClick={() => navigate('/mer/mina-mal')}
                    className="w-full px-4 py-3 text-left hover:bg-stone-50 active:bg-stone-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-stone-800 truncate pr-2">{goal.text}</p>
                      <span className="text-xs font-bold text-forest-600 flex-shrink-0">{pct}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5">
                      <div
                        className="bg-forest-700 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Dagens måltider */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
              Dagens måltider
            </p>
            <button
              onClick={() => navigate('/kost')}
              className="text-xs text-forest-600 font-medium"
            >
              Logga mat →
            </button>
          </div>

          {loggedMeals.length === 0 ? (
            <button
              onClick={() => navigate('/kost')}
              className="w-full bg-white rounded-2xl border border-stone-100 p-4 text-left active:scale-[0.98] transition-transform"
            >
              <p className="text-sm text-stone-500">Inga måltider loggade ännu.</p>
              <p className="text-xs text-forest-600 font-medium mt-1">Lägg till din första måltid →</p>
            </button>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden divide-y divide-stone-50">
              {loggedMeals.map((slot) => {
                const slotEntries = entries.filter((e) => e.meal_slot === slot)
                const kcal = slotEntries.reduce((s, e) => s + e.kcal, 0)
                return (
                  <button
                    key={slot}
                    onClick={() => navigate('/kost')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 active:bg-stone-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-stone-800">{MEAL_LABELS[slot]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-400">{kcal} kcal</span>
                      <ChevronRightIcon className="w-4 h-4 stroke-stone-300" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Snabbåtkomst */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide px-1 mb-2">
            Snabbåtkomst
          </p>
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden divide-y divide-stone-100">
            {QUICK_LINKS.map(({ Icon, label, sub, path, iconBg, iconStroke }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 active:bg-stone-100 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${iconStroke}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-stone-900">{label}</p>
                  <p className="text-xs text-stone-400">{sub}</p>
                </div>
                <ChevronRightIcon className="w-4 h-4 stroke-stone-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
