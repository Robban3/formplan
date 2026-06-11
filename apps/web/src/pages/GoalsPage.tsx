import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon, XIcon, TargetIcon } from '../components/ui/Icons'
import { parseGoal, computeAutoProgress, goalStatusText, type GoalMeta } from '../lib/goalTracker'

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

const SUGGESTIONS = [
  { text: 'Träna 3 gånger i veckan',       hint: 'Automatisk spårning ✓' },
  { text: 'Träna 4 gånger i veckan',        hint: 'Automatisk spårning ✓' },
  { text: 'Dricka 2,5 liter vatten per dag', hint: 'Automatisk spårning ✓' },
  { text: 'Dricka 2 liter vatten per dag',   hint: 'Automatisk spårning ✓' },
  { text: 'Gå ner 5 kg',                    hint: 'Automatisk spårning ✓' },
  { text: 'Väga 75 kg',                     hint: 'Automatisk spårning ✓' },
  { text: 'Klara 50 pass totalt',           hint: 'Automatisk spårning ✓' },
  { text: 'Springa 5 km utan paus',         hint: 'Manuellt' },
  { text: 'Klara 10 pull-ups i rad',        hint: 'Manuellt' },
]

type Tab = 'aktiva' | 'tidigare'

function GoalCard({
  goal,
  onToggle,
  onDelete,
  onSetProgress,
}: {
  goal: Goal
  onToggle: () => void
  onDelete: () => void
  onSetProgress: (v: number) => void
}) {
  const [editingProgress, setEditingProgress] = useState(false)
  const pct = effectiveProgress(goal)
  const statusText = goal.goalMeta ? goalStatusText(goal.goalMeta) : null
  const isAuto = goal.goalMeta && goal.goalMeta.type !== 'manual'

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4">
      <div className="flex items-start gap-3">
        {/* Icon / toggle */}
        <button
          onClick={onToggle}
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            goal.done ? 'bg-forest-700' : 'bg-forest-50'
          }`}
        >
          <TargetIcon className={`w-5 h-5 ${goal.done ? 'text-white' : 'text-forest-600'}`} />
        </button>

        <div className="flex-1 min-w-0">
          {/* Title + auto badge */}
          <div className="flex items-start gap-2">
            <p className={`text-sm font-semibold flex-1 ${goal.done ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
              {goal.text}
            </p>
            {isAuto && !goal.done && (
              <span className="text-[9px] bg-forest-100 text-forest-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                Auto
              </span>
            )}
          </div>

          {/* Live status */}
          {statusText && !goal.done && (
            <p className="text-xs text-stone-400 mt-0.5">{statusText}</p>
          )}
          {!statusText && !goal.done && (
            <p className="text-xs text-stone-400 mt-0.5">Framsteg</p>
          )}

          {/* Progress bar */}
          <div
            className={`mt-2 ${!isAuto && !goal.done ? 'cursor-pointer' : ''}`}
            onClick={() => !isAuto && !goal.done && setEditingProgress((v) => !v)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-stone-700">{pct}%</span>
              {!isAuto && !goal.done && (
                <span className="text-[10px] text-stone-400">Tryck för att justera</span>
              )}
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2">
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
                className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 font-bold text-sm flex items-center justify-center"
              >−</button>
              <div className="flex-1 text-center text-sm font-semibold text-stone-900">{goal.progress}%</div>
              <button
                onClick={() => onSetProgress(Math.min(100, goal.progress + 10))}
                className="w-8 h-8 rounded-lg bg-forest-700 text-white font-bold text-sm flex items-center justify-center"
              >+</button>
            </div>
          )}
        </div>

        <button onClick={onDelete} className="p-1 -mr-1 -mt-1 flex-shrink-0">
          <XIcon className="w-4 h-4 text-stone-300" />
        </button>
      </div>
    </div>
  )
}

export function GoalsPage() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState<Goal[]>(loadGoals)
  const [tab, setTab] = useState<Tab>('aktiva')
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')

  function persist(updated: Goal[]) { setGoals(updated); saveGoals(updated) }

  function addGoal(t: string) {
    if (!t.trim()) return
    const goalMeta = parseGoal(t.trim())
    persist([
      ...goals,
      {
        id: crypto.randomUUID(),
        text: t.trim(),
        done: false,
        createdAt: new Date().toISOString(),
        progress: 0,
        goalMeta,
      },
    ])
    setText('')
    setAdding(false)
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
      <div className="px-5 pt-header pb-4 bg-white border-b border-stone-100">
        <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 text-stone-400" />
          Mer
        </button>
        <h1 className="text-2xl font-bold text-stone-900">Mina mål</h1>

        <div className="flex gap-5 mt-4 border-b border-stone-100 -mb-4">
          {(['aktiva', 'tidigare'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-4 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'text-forest-600 border-b-2 border-forest-600' : 'text-stone-400'
              }`}
            >
              {t === 'aktiva' ? `Aktiva mål${active.length > 0 ? ` (${active.length})` : ''}` : 'Tidigare mål'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-3">
        {shown.length === 0 && (
          <div className="text-center py-12">
            <TargetIcon className="w-12 h-12 text-stone-200 mx-auto mb-3" />
            <p className="text-stone-400 text-sm">
              {tab === 'aktiva' ? 'Inga aktiva mål ännu.' : 'Inga avklarade mål ännu.'}
            </p>
          </div>
        )}

        {shown.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onToggle={() => toggleDone(goal.id)}
            onDelete={() => deleteGoal(goal.id)}
            onSetProgress={(v) => setProgress(goal.id, v)}
          />
        ))}

        {/* Add form */}
        {adding && tab === 'aktiva' && (
          <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal(text)}
              placeholder="Beskriv ditt mål…"
              className="w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
            />

            {/* Auto-detection preview */}
            {preview && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${
                previewIsAuto ? 'bg-forest-50 text-forest-700' : 'bg-stone-50 text-stone-400'
              }`}>
                <span>{previewIsAuto ? '✓ Automatisk spårning detekterad' : '○ Manuell uppföljning'}</span>
              </div>
            )}

            {/* Suggestions */}
            <div className="space-y-1">
              <p className="text-xs text-stone-400 font-medium">Förslag med automatisk spårning:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.filter((s) => s.hint.includes('Auto')).map((s) => (
                  <button
                    key={s.text}
                    onClick={() => addGoal(s.text)}
                    className="text-xs bg-forest-50 text-forest-700 border border-forest-100 px-3 py-1.5 rounded-full hover:bg-forest-100 transition-colors"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium">
                Avbryt
              </button>
              <button onClick={() => addGoal(text)} className="flex-1 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold">
                Lägg till
              </button>
            </div>
          </div>
        )}
      </div>

      {tab === 'aktiva' && !adding && (
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-full max-w-lg px-5 pb-4 pt-3 bg-gradient-to-t from-stone-50">
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-forest-700 text-white rounded-2xl text-sm font-semibold shadow-lg"
          >
            <PlusIcon className="w-4 h-4" />
            Lägg till nytt mål
          </button>
        </div>
      )}
    </div>
  )
}
