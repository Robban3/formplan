import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon, XIcon, TargetIcon } from '../components/ui/Icons'
import { parseGoal, computeAutoProgress, goalStatusText, type GoalMeta } from '../lib/goalTracker'
import { planAdjustmentForGoal, type PlanAdjustment } from '../lib/goalPlan'
import { getWeightEntries } from '../lib/weightStore'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { goalSuggestions } from '../lib/goalSuggestions'
import { useT } from '../hooks/useT'
import { useUnits } from '../hooks/useUnits'
import type { TextKey } from '../lib/i18n'

export interface Goal {
  id: string
  text: string
  done: boolean
  createdAt: string
  progress: number      // manual override (0–100), used when auto=null
  goalMeta?: GoalMeta   // set on creation by parser
}

export const GOALS_STORAGE_KEY = 'formplan_goals'

export function loadGoals(): Goal[] {
  try {
    const raw = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY) ?? '[]') as Partial<Goal>[]
    return raw.map((g) => {
      // Migrate old goals: run parser if goalMeta is missing
      const goalMeta = g.goalMeta ?? parseGoal(g.text ?? '')
      return {
        id: g.id ?? crypto.randomUUID(),
        text: g.text ?? '',
        done: g.done ?? false,
        createdAt: g.createdAt ?? new Date().toISOString(),
        progress: g.progress ?? (g.done ? 100 : 0),
        goalMeta,
      }
    })
  } catch {
    return []
  }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))
}

/** Returns effective progress: auto-computed if possible, else stored manual value */
export function effectiveProgress(goal: Goal): number {
  if (goal.done) return 100
  if (goal.goalMeta) {
    const auto = computeAutoProgress(goal.goalMeta)
    if (auto !== null) return auto
  }
  return goal.progress
}


type Tab = 'aktiva' | 'tidigare'

function GoalCard({
  goal,
  onToggle,
  onDelete,
  onSetProgress,
  adjustment,
  onApply,
}: {
  goal: Goal
  onToggle: () => void
  onDelete: () => void
  onSetProgress: (v: number) => void
  /** Null när målet inte kan styra schemat — då visas ingen knapp. */
  adjustment: PlanAdjustment | null
  onApply: () => void
}) {
  const [editingProgress, setEditingProgress] = useState(false)
  const { t } = useT()
  const { imperial, lang } = useUnits()
  const pct = effectiveProgress(goal)
  const statusText = goal.goalMeta ? goalStatusText(goal.goalMeta, { t, imperial, lang }) : null
  const isAuto = goal.goalMeta && goal.goalMeta.type !== 'manual'

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
      <div className="flex items-start gap-3">
        {/* Icon / toggle */}
        <button
          onClick={onToggle}
          aria-label={t(goal.done ? 'goals.markNotDone' : 'goals.markDone', { goal: goal.text })}
          aria-pressed={goal.done}
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            goal.done ? 'bg-forest-700' : 'bg-forest-50 dark:bg-forest-900/30'
          }`}
        >
          <TargetIcon className={`w-5 h-5 ${goal.done ? 'text-white' : 'text-forest-800 dark:text-forest-400'}`} />
        </button>

        <div className="flex-1 min-w-0">
          {/* Title + auto badge */}
          <div className="flex items-start gap-2">
            <p className={`text-sm font-semibold flex-1 ${goal.done ? 'text-stone-500 dark:text-stone-400 line-through' : 'text-stone-900 dark:text-stone-100'}`}>
              {goal.text}
            </p>
            {isAuto && !goal.done && (
              <span className="text-[9px] bg-forest-100 dark:bg-forest-900/40 text-forest-800 dark:text-forest-300 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                {t('common.auto')}
              </span>
            )}
          </div>

          {/* Live status */}
          {statusText && !goal.done && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{statusText}</p>
          )}
          {!statusText && !goal.done && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('common.progress')}</p>
          )}

          {/* Progress bar */}
          <div
            className={`mt-2 ${!isAuto && !goal.done ? 'cursor-pointer' : ''}`}
            onClick={() => !isAuto && !goal.done && setEditingProgress((v) => !v)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{pct}%</span>
              {!isAuto && !goal.done && (
                <span className="text-[10px] text-stone-500 dark:text-stone-400">{t('goals.tapToAdjust')}</span>
              )}
            </div>
            <div className="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${goal.done ? 'bg-forest-400' : 'bg-forest-700'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Manual progress editor */}
          {editingProgress && !isAuto && !goal.done && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onSetProgress(Math.max(0, goal.progress - 10))}
                className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-bold text-sm flex items-center justify-center"
              >−</button>
              <div className="flex-1 text-center text-sm font-semibold text-stone-900 dark:text-stone-100">{goal.progress}%</div>
              <button
                onClick={() => onSetProgress(Math.min(100, goal.progress + 10))}
                className="w-8 h-8 rounded-lg bg-forest-700 text-white font-bold text-sm flex items-center justify-center"
              >+</button>
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          aria-label={t('goals.deleteGoal', { goal: goal.text })}
          className="p-1 -mr-1 -mt-1 flex-shrink-0"
        >
          <XIcon className="w-4 h-4 text-stone-300 dark:text-stone-600" />
        </button>
      </div>

      {/* Bara mål som faktiskt säger något om HUR man ska träna kan styra
          schemat. Vattenmål, "klara 50 pass totalt" och fritext gör det inte —
          en knapp där hade lovat något appen inte kan hålla. */}
      {adjustment && !goal.done && (
        <button
          onClick={onApply}
          className="mt-3 w-full py-2.5 rounded-xl border border-forest-200 dark:border-forest-800 bg-forest-50 dark:bg-forest-900/30 text-sm font-semibold text-forest-800 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900/40 transition-colors"
        >
          {t('goals.adjustPlan')}
        </button>
      )}
    </div>
  )
}

export function GoalsPage() {
  const { t } = useT()
  const { imperial } = useUnits()
  const suggestions = goalSuggestions(t, imperial)
  const navigate = useNavigate()
  const [goals, setGoals] = useState<Goal[]>(loadGoals)
  const [tab, setTab] = useState<Tab>('aktiva')
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  // Målet som väntar på bekräftelse innan schemat byggs om.
  const [pending, setPending] = useState<{ goal: Goal; adjustment: PlanAdjustment } | null>(null)
  const [applying, setApplying] = useState(false)

  // Senaste loggade vikt — avgör åt vilket håll ett viktmål pekar.
  const currentWeight = getWeightEntries().slice(-1)[0]?.weight_kg ?? null

  function persist(updated: Goal[]) { setGoals(updated); saveGoals(updated) }

  function addGoal(goalText: string) {
    if (!goalText.trim()) return
    const goalMeta = parseGoal(goalText.trim())
    persist([
      ...goals,
      {
        id: crypto.randomUUID(),
        text: goalText.trim(),
        done: false,
        createdAt: new Date().toISOString(),
        progress: 0,
        goalMeta,
      },
    ])
    setText('')
    setAdding(false)
    // Målet sparas direkt, men inget sa det — användaren letade efter en
    // spara-knapp som inte finns.
    toast.success(t('goals.saved'))
  }

  /**
   * Skriver målets ändring till profilen och genererar om schemat.
   *
   * POST /profile kräver hela profilen, så den hämtas och slås ihop — en
   * delmängd hade nollställt resten. Schemat genereras först när profilen
   * sparats; misslyckas sparandet ska inget schema byggas om.
   */
  async function applyAdjustment() {
    if (!pending) return
    setApplying(true)
    let profileSaved = false
    try {
      const { profile } = await api.getProfile()
      if (!profile || typeof profile !== 'object') {
        toast.error(t('goals.needProfile'))
        return
      }
      await api.saveProfile({ ...(profile as Record<string, unknown>), ...pending.adjustment.patch })
      // Profilen är ändrad från och med nu. Failar genereringen får användaren
      // INTE tro att ingenting hände: målet i profilen styr nästa schema, och
      // på gratisnivån (tak: en plan) failar genereringen varje gång.
      profileSaved = true
      await api.generatePlan()
      toast.success(t('goals.planRebuilding'))
      setPending(null)
      navigate('/traning')
    } catch (e) {
      toast.error(
        profileSaved
          ? t('goals.savedButPlanFailed')
          : (e as Error).message || t('goals.saveFailed')
      )
    } finally {
      setApplying(false)
    }
  }

  function toggleDone(id: string) {
    persist(goals.map((g) => g.id === id ? { ...g, done: !g.done, progress: !g.done ? 100 : g.progress } : g))
  }

  function setProgress(id: string, value: number) {
    persist(goals.map((g) => g.id === id ? { ...g, progress: value } : g))
  }

  function deleteGoal(id: string) { persist(goals.filter((g) => g.id !== id)) }

  const active = goals.filter((g) => !g.done)
  const previous = goals.filter((g) => g.done)
  const shown = tab === 'aktiva' ? active : previous

  // Preview of detected type when typing
  const preview = text.trim() ? parseGoal(text.trim()) : null
  const previewIsAuto = preview && preview.type !== 'manual'

  return (
    <div className="pb-24">
      <div className="px-5 pt-header pb-4 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          {t('nav.more')}
        </button>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t('more.goals')}</h1>

        <div className="flex gap-5 mt-4 border-b border-stone-200 dark:border-stone-700 -mb-4">
          {(['aktiva', 'tidigare'] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`pb-4 text-sm font-medium capitalize transition-colors ${
                tab === tabKey ? 'text-forest-800 dark:text-forest-400 border-b-2 border-forest-600' : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {tabKey === 'aktiva' ? `${t('goals.tab.active')}${active.length > 0 ? ` (${active.length})` : ''}` : t('goals.tab.past')}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-3">
        {shown.length === 0 && (
          <div className="text-center py-12">
            <TargetIcon className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              {tab === 'aktiva' ? t('goals.noActive') : t('goals.noDone')}
            </p>
          </div>
        )}

        {shown.map((goal) => {
          const adjustment = planAdjustmentForGoal(goal.goalMeta, currentWeight)
          return (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggle={() => toggleDone(goal.id)}
              onDelete={() => deleteGoal(goal.id)}
              onSetProgress={(v) => setProgress(goal.id, v)}
              adjustment={adjustment}
              onApply={() => adjustment && setPending({ goal, adjustment })}
            />
          )
        })}

        {/* Bekräftelse. Att generera om ersätter det nuvarande schemat och
            förbrukar generering ur kvoten (3/h, en plan totalt på gratisnivån),
            så det får aldrig hända av ett enda tryck. */}
        {pending && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6">
            <div className="bg-white dark:bg-stone-800 rounded-2xl p-5 w-full max-w-sm">
              <p className="font-bold text-stone-900 dark:text-stone-100">Anpassa schemat?</p>
              <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">{pending.adjustment.description}</p>
              <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
                {t('goals.planWillBeReplaced')}
              </p>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setPending(null)}
                  disabled={applying}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-600 dark:text-stone-300 disabled:opacity-60"
                >
                  {t('onb.cancel')}
                </button>
                <button
                  onClick={applyAdjustment}
                  disabled={applying}
                  className="flex-1 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {applying ? t('goals.rebuilding') : t('goals.rebuildPlan')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add form */}
        {adding && tab === 'aktiva' && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal(text)}
              placeholder={t('goals.describePlaceholder')}
              className="w-full bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-3 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
            />

            {/* Auto-detection preview */}
            {preview && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${
                previewIsAuto ? 'bg-forest-50 dark:bg-forest-900/30 text-forest-800 dark:text-forest-300' : 'bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
              }`}>
                <span>{previewIsAuto ? t('goals.autoDetected') : t('goals.manualFollowUp')}</span>
              </div>
            )}

            {/* Suggestions */}
            <div className="space-y-1">
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{t('goals.suggestionsHeading')}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.filter((s) => s.auto).map((s) => (
                  <button
                    key={s.text}
                    onClick={() => addGoal(s.text)}
                    className="text-xs bg-forest-50 dark:bg-forest-900/30 text-forest-800 dark:text-forest-300 border border-forest-100 dark:border-forest-800 px-3 py-1.5 rounded-full hover:bg-forest-100 dark:hover:bg-forest-900/40 transition-colors"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-sm font-medium">
                {t('onb.cancel')}
              </button>
              <button onClick={() => addGoal(text)} className="flex-1 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold">
                {t('food.add')}
              </button>
            </div>
          </div>
        )}
      </div>

      {tab === 'aktiva' && !adding && (
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-full max-w-lg px-5 pb-4 pt-3 bg-gradient-to-t from-stone-50 dark:from-stone-900">
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-forest-700 text-white rounded-2xl text-sm font-semibold shadow-lg"
          >
            <PlusIcon className="w-4 h-4" />
            {t('goals.addGoal')}
          </button>
        </div>
      )}
    </div>
  )
}
