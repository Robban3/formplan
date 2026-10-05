import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { deriveDifficulty } from '../../lib/derive'
import { useWeeklySessions } from '../../contexts/WeeklySessionsContext'
import { toast } from '../../lib/toast'
import { toastIfNotNetwork, isNetworkError } from '../../lib/errors'
import { PlusIcon, DumbbellIcon, PlayIcon, ChevronDownIcon } from '../../components/ui/Icons'
import { WorkoutHero } from '../../components/training/WorkoutHero'
import { useWorkoutStore } from '../../hooks/useWorkoutStore'
import { useLoadTimeout } from '../../hooks/useLoadTimeout'
import { getTrainingStreak, getLongestStreak } from '../../lib/streakStore'
import { loadActivePlan, type WorkoutPlanDay } from '../../lib/planLoader'
import { parseMockPlanId } from '../../lib/mockPlan'
import { workoutStore, type ExerciseLog } from '../../store/workoutStore'
import {
  EXERCISE_CATALOG,
  EXERCISE_CATEGORIES,
  MUSCLE_LABELS,
  type CatalogExercise,
  type ExerciseCategory,
} from '../../lib/exerciseCatalog'
import { resolveExercise } from '../../lib/exerciseResolve'
import { ExerciseMedia } from '../../components/training/ExerciseMedia'
import { ExerciseDetail } from '../../components/training/ExerciseDetail'
import { PROGRAM_TEMPLATES, type ProgramTemplate, type TemplateDay } from '../../lib/programTemplates'
import { useT } from '../../hooks/useT'
import { allowedEquipment } from '../../lib/equipment'
import { equipmentLabel } from '../../lib/equipmentLabels'
import { missingEquipment } from '../../lib/programTemplates'
import { weekdayNames } from '../../lib/i18n'
import type { TextKey } from '../../lib/i18n'

type WorkoutDay = WorkoutPlanDay

interface Plan {
  id: string
  status: string
  created_at: string
}


const SHORT = ['M', 'Ti', 'O', 'To', 'F', 'L', 'S']

function todayWeekday() {
  const d = new Date().getDay()
  return d === 0 ? 7 : d // 1=Mon … 7=Sun
}

export function TrainingOverview() {
  const [profileEquipment, setProfileEquipment] = useState<string[]>([])
  const { locale, t } = useT()
  const WEEKDAYS = weekdayNames(locale, 'long')
  // En gång per utrustningsändring: allowedEquipment itererar hela katalogen.
  const allowed = useMemo(() => allowedEquipment(profileEquipment), [profileEquipment])
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

  // Guards for the long-running generate poll: mountedRef bails out of late
  // setState/toasts after the component unmounts; generatingRef synchronously
  // blocks a double-tap from starting a second poll.
  const mountedRef = useRef(true)
  const generatingRef = useRef(false)
  useEffect(() => () => { mountedRef.current = false }, [])

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
        // Utrustningen styr vilka färdiga program som går att genomföra.
        const eq = (profile as { equipment?: string[] } | null)?.equipment
        if (eq?.length) setProfileEquipment(eq)
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
    if (generatingRef.current) return
    generatingRef.current = true
    setGenerating(true)
    try {
      const { plan_id } = await api.generatePlan()
      sessionStorage.setItem('formplan_plan_id', plan_id)
      // Poll until ready with a gentle backoff (2s → 6s). AI generation can take
      // well over 40s, so we allow up to ~40 checks (~3 min) before giving up.
      let attempts = 0
      let ready = false
      let errored = false
      while (attempts < 40) {
        const delay = Math.min(2000 + attempts * 500, 6000)
        await new Promise((r) => setTimeout(r, delay))
        try {
          const { plan, days } = await api.getPlan(plan_id)
          const p = plan as Plan
          if (p.status === 'ready') {
            if (mountedRef.current) {
              setPlan(p)
              setDays((days as WorkoutDay[]).filter((d) => d.type === 'workout'))
            }
            ready = true
            break
          }
          if (p.status === 'error') {
            errored = true
            break
          }
        } catch (e) {
          // Transient network blip while polling — keep trying. Re-throw a real
          // API error so the outer catch reports it.
          if (!isNetworkError(e)) throw e
        }
        attempts++
      }
      if (mountedRef.current) {
        if (errored) {
          toast.error(t('training.planFailed'))
        } else if (!ready) {
          // Timed out, but the plan is still being generated server-side. Keep the
          // stored plan_id so the next mount picks it up when it's ready.
          toast.info(t('training.planSlow'))
        }
      }
    } catch (e) {
      if (mountedRef.current) toastIfNotNetwork(e, toast.error)
    } finally {
      generatingRef.current = false
      if (mountedRef.current) setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  function startTemplateDay(templateId: string, day: TemplateDay) {
    const exercises: ExerciseLog[] = day.exercises.map((ex) => ({
      name: ex.name,
      targetSets: ex.sets,
      targetReps: ex.reps,
      restSeconds: ex.rest_seconds,
      sets: Array.from({ length: ex.sets }, () => ({ reps: 0, weight_kg: null, done: false })),
    }))
    workoutStore.start({
      planDayId: `template-${templateId}`,
      workoutName: t(day.nameKey),
      startedAt: Date.now(),
      exercises,
      currentExerciseIndex: 0,
    })
    navigate(`/workout/template-${templateId}/active`)
  }

  return (
    <div className="pb-4">
      <WorkoutHero
        as="h1"
        title={t('nav.training')}
        subtitle={
          plan
            ? `${thisWeekDone} av ${totalWeek} pass denna vecka${isMock ? ' · testdata' : ''}`
            : t('training.yourPlan')
        }
      />

      <div className="px-5 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <div className="flex gap-5">
          {(['pass', 'program', 'ovningar'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`pb-3 pt-1 text-sm font-medium capitalize transition-colors ${
                tab === tabKey
                  ? 'text-forest-800 dark:text-forest-400 border-b-2 border-forest-600'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {tabKey === 'pass' ? t('training.sessions') : tabKey === 'program' ? t('training.programs') : t('training.exercises')}
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
              className="w-full flex items-center justify-between bg-forest-700 text-white rounded-2xl px-4 py-3"
            >
              <div className="text-left">
                <p className="text-xs text-forest-200">{t('training.ongoing')}</p>
                <p className="font-semibold">{activeWorkout.workoutName}</p>
              </div>
              <span className="text-sm font-mono bg-forest-700 px-3 py-1 rounded-lg">
                {t('training.resume')}
              </span>
            </button>
          )}

          {/* Weekly ring + streak */}
          {plan && (
            <div className="bg-stone-100 dark:bg-stone-700 rounded-2xl p-4 flex items-center gap-4">
              <WeeklyRing done={thisWeekDone} total={totalWeek} />
              <div className="flex-1">
                <p className="text-xs text-stone-500 dark:text-stone-400">{t('home.thisWeek')}</p>
                <p className="font-bold text-stone-900 dark:text-stone-100 text-lg">{thisWeekDone} av {totalWeek} pass</p>
              </div>
              {streak > 0 && (
                <div className="flex flex-col items-center bg-amber-50 dark:bg-amber-900/25 rounded-xl px-3 py-2">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{streak}</span>
                  <span className="text-[9px] text-amber-700 dark:text-amber-300">{t('home.dayStreak')}</span>
                  {longestStreak > streak && (
                    <span className="text-[8px] text-stone-500 dark:text-stone-400">rekord: {longestStreak}</span>
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
                      isToday ? 'bg-forest-700 text-white' : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {s}
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      hasWorkout
                        ? isToday ? 'bg-white dark:bg-stone-800' : 'bg-forest-700'
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
                <DumbbellIcon className="w-12 h-12 stroke-stone-300 dark:stroke-stone-600" />
              </div>
              <h2 className="text-lg font-semibold mb-1">{t('training.noPlanYet')}</h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{t('training.noPlanHint')}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  {generating ? t('training.generating') : t('training.generatePlan')}
                </button>
                <button
                  onClick={() => navigate('/traning/egna')}
                  className="border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold px-5 py-3 rounded-xl flex items-center gap-2 hover:border-forest-400 hover:text-forest-600 transition-colors"
                >
                  <DumbbellIcon className="w-4 h-4" />
                  {t('page.customWorkouts')}
                </button>
              </div>
            </div>
          )}

          {/* Snabbknappar — bara när ett schema finns. Utan schema visar det
              tomma tillståndet ovanför redan samma två val, och raden blev en
              dubblett av sig själv. */}
          {plan && (
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700 rounded-xl py-3 text-sm text-stone-500 dark:text-stone-400 hover:border-forest-400 hover:text-forest-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {generating ? t('training.generating') : t('training.aiPlan')}
            </button>
            <button
              onClick={() => navigate('/traning/egna')}
              className="flex-1 flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700 rounded-xl py-3 text-sm text-stone-500 dark:text-stone-400 hover:border-forest-400 hover:text-forest-600 transition-colors"
            >
              <DumbbellIcon className="w-4 h-4" />
              {t('page.customWorkouts')}
            </button>
          </div>
          )}
        </div>
      )}

      {tab === 'program' && (
        <div className="px-5 mt-4 space-y-5">
          {/* Ditt AI-schema (om det finns) */}
          {workoutDays.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">{t('training.myPlan')}</p>
              {workoutDays.map((day) => (
                <div key={day.id} className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">{WEEKDAYS[(day.weekday ?? 1) - 1]}</span>
                      <p className="font-semibold text-stone-900 dark:text-stone-100">{day.content.name}</p>
                    </div>
                    <span className="text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded-lg">
                      {day.content.duration_minutes} min
                    </span>
                  </div>
                  <ProgramExerciseList exercises={day.content.exercises} />
                </div>
              ))}
            </div>
          )}

          {/* Färdiga program — alltid tillgängliga */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">{t('training.readyPrograms')}</p>
            {PROGRAM_TEMPLATES.map((tpl) => (
              <ProgramTemplateCard key={tpl.id} template={tpl} onStartDay={startTemplateDay} allowed={allowed} />
            ))}
          </div>
        </div>
      )}

      {tab === 'ovningar' && <ExerciseLibrary />}
    </div>
  )
}

function ProgramExerciseList({
  exercises,
}: {
  exercises: { name: string; sets: number; reps: string; exercise_id?: string }[]
}) {
  return (
    <div className="divide-y divide-stone-50">
      {exercises.map((ex, i) => {
        // Media visas bara för en säkert upplöst katalogövning — annars ingen bild.
        const catalog = resolveExercise(ex)
        return (
          <div key={i} className="py-2.5 first:pt-0">
            <div className="flex items-center gap-2.5">
              {catalog && <ExerciseMedia key={catalog.id} exercise={catalog} variant="thumb" />}
              <span className="text-sm text-stone-700 dark:text-stone-300 flex-1 min-w-0 truncate">{ex.name}</span>
              <span className="text-xs text-stone-500 dark:text-stone-400 shrink-0">{ex.sets} × {ex.reps}</span>
            </div>
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
  const { t } = useT()
  const { locale } = useT()
  const WEEKDAYS = weekdayNames(locale, 'long')
  const diff: Record<string, string> = {
    Lätt: 'bg-teal-100 text-teal-800 dark:text-teal-300',
    Medel: 'bg-amber-100 dark:bg-amber-900/35 text-amber-700 dark:text-amber-300',
    Hög: 'bg-red-100 text-red-700 dark:text-red-300',
  }
  const diffLabel = deriveDifficulty(day.content)

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm border border-stone-200 dark:border-stone-700 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isToday && (
              <span className="text-xs bg-forest-700 text-white px-2 py-0.5 rounded-full font-medium">
                {t('tab.today')}
              </span>
            )}
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {WEEKDAYS[(day.weekday ?? 1) - 1]}
            </span>
          </div>
          <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">{day.content.name}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {day.content.duration_minutes} min · {day.content.focus}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diff[diffLabel] ?? diff['Medel']}`}>
            {diffLabel}
          </span>
          {isToday && (
            <span className="text-xs text-forest-800 dark:text-forest-400 font-medium">Starta →</span>
          )}
        </div>
      </div>

      {/* Exercise preview */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {day.content.exercises.slice(0, 3).map((ex, i) => (
          <span key={i} className="text-xs bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 px-2 py-1 rounded-lg">
            {ex.name}
          </span>
        ))}
        {day.content.exercises.length > 3 && (
          <span className="text-xs bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 px-2 py-1 rounded-lg">
            +{day.content.exercises.length - 3} till
          </span>
        )}
      </div>
    </button>
  )
}

// Standalone, always-available exercise library driven by the curated catalog:
// search + category filter, each row with its own images and muscle chips.
/**
 * Kategorivärdena är svenska och matchas mot övningskatalogen — bara
 * etiketten går via ordlistan. Fjärde stället med samma koppling.
 */
const CATEGORY_KEYS: Record<'Alla' | ExerciseCategory, TextKey> = {
  'Alla': 'tab.all',
  'Bröst': 'exCat.chest',
  'Rygg': 'exCat.back',
  'Ben': 'exCat.legs',
  'Axlar': 'exCat.shoulders',
  'Armar': 'exCat.arms',
  'Core': 'exCat.core',
  'Kondition': 'exCat.cardio',
}

function ExerciseLibrary() {
  const { t } = useT()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ExerciseCategory | 'Alla'>('Alla')
  const [openId, setOpenId] = useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const matches = (ex: CatalogExercise) =>
    !q ||
    ex.name.toLowerCase().includes(q) ||
    ex.category.toLowerCase().includes(q) ||
    ex.aliases.some((a) => a.toLowerCase().includes(q)) ||
    ex.primaryMuscles.some((m) => MUSCLE_LABELS[m].toLowerCase().includes(q))

  const visible = EXERCISE_CATALOG.filter(
    (ex) => (category === t('tab.all') || ex.category === category) && matches(ex)
  )
  const groups = EXERCISE_CATEGORIES.map((c) => ({
    category: c,
    items: visible.filter((ex) => ex.category === c),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="px-5 mt-4 space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('training.searchExercise')}
        className="w-full bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-3 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-400 text-sm"
      />

      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
        {(['Alla', ...EXERCISE_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              category === c
                ? 'bg-forest-700 border-forest-700 text-white'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400'
            }`}
          >
            {t(CATEGORY_KEYS[c])}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="text-stone-500 dark:text-stone-400 text-sm text-center py-6">{t('training.noMatches')}</p>
      )}

      {groups.map((g) => (
        <div key={g.category}>
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mt-3 mb-1.5 px-1">
            {g.category}
          </p>
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            {g.items.map((ex, i) => {
              const open = openId === ex.id
              return (
                <div key={ex.id} className={i > 0 ? 'border-t border-stone-50' : ''}>
                  <button
                    onClick={() => setOpenId(open ? null : ex.id)}
                    aria-expanded={open}
                    className="w-full text-left px-4 py-3 flex items-center gap-3"
                  >
                    <ExerciseMedia exercise={ex} variant="thumb" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{ex.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ex.primaryMuscles.map((m) => (
                          <span
                            key={m}
                            className="text-[10px] font-medium text-forest-800 dark:text-forest-300 bg-forest-50 dark:bg-forest-900/30 rounded-full px-1.5 py-0.5"
                          >
                            {MUSCLE_LABELS[m]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronDownIcon
                      className={`w-4 h-4 stroke-stone-300 dark:stroke-stone-600 flex-shrink-0 transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="px-4 pb-4">
                      <ExerciseDetail exercise={ex} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// A pre-made program: expandable card with its days; each day can be started.
function ProgramTemplateCard({
  template,
  onStartDay,
  allowed,
}: {
  template: ProgramTemplate
  onStartDay: (templateId: string, day: TemplateDay) => void
  /** Katalogens utrustningsvärden användaren har. */
  allowed: Set<string>
}) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  // Programmen döljs inte när något saknas — alla kräver skivstång, kabel och
  // maskin, så filtrering hade tömt sektionen. Att visa VAD som saknas säger
  // mer än att visa ingenting.
  const missing = missingEquipment(template, allowed)
  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-stone-900 dark:text-stone-100">{t(template.nameKey)}</p>
          <span className="text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded-lg flex-shrink-0">
            {t('training.daysPerWeekShort', { n: template.days_per_week })}
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t(template.descKey)}</p>
        {missing.length > 0 && (
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1.5">
            {t('training.needsEquipment', {
              equipment: missing.map((eq) => equipmentLabel(eq, t)).join(', '),
            })}
          </p>
        )}
        <p className="text-[11px] text-forest-800 dark:text-forest-400 font-medium mt-2">{open ? t('training.hideSessions') : t('training.showSessions')}</p>
      </button>

      {open && (
        <div className="border-t border-stone-50 divide-y divide-stone-50">
          {template.days.map((day) => (
            <div key={day.name} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{t(day.nameKey)}</p>
                <button
                  onClick={() => onStartDay(template.id, day)}
                  className="flex items-center gap-1 text-xs font-semibold bg-forest-700 text-white px-3 py-1.5 rounded-lg"
                >
                  <PlayIcon className="w-3.5 h-3.5 stroke-white" />
                  {t('challenges.start')}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {day.exercises.map((ex) => (
                  <span key={ex.name} className="text-[11px] bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 px-2 py-1 rounded-lg">
                    {ex.name} {ex.sets}×{ex.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WeeklyRing({ done, total }: { done: number; total: number }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r}
        fill="none"
        stroke="#0d9480"
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
