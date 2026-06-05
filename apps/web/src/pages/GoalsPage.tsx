import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon, XIcon, TargetIcon } from '../components/ui/Icons'

interface Goal {
  id: string
  text: string
  done: boolean
  createdAt: string
  progress: number // 0–100
}

const STORAGE_KEY = 'formplan_goals'

function loadGoals(): Goal[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Partial<Goal>[]
    return raw.map((g) => ({
      id: g.id ?? crypto.randomUUID(),
      text: g.text ?? '',
      done: g.done ?? false,
      createdAt: g.createdAt ?? new Date().toISOString(),
      progress: g.progress ?? (g.done ? 100 : 0),
    }))
  } catch {
    return []
  }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
}

const SUGGESTIONS = [
  'Gå ner 5 kg på 3 månader',
  'Springa 5 km utan paus',
  'Klara 10 pull-ups i rad',
  'Träna 3 gånger i veckan',
  'Dricka 2,5 L vatten per dag',
  'Äta protein vid varje måltid',
]

type Tab = 'aktiva' | 'tidigare'

export function GoalsPage() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState<Goal[]>(loadGoals)
  const [tab, setTab] = useState<Tab>('aktiva')
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [editingProgress, setEditingProgress] = useState<string | null>(null)

  function persist(updated: Goal[]) {
    setGoals(updated)
    saveGoals(updated)
  }

  function addGoal(t: string) {
    if (!t.trim()) return
    persist([
      ...goals,
      { id: crypto.randomUUID(), text: t.trim(), done: false, createdAt: new Date().toISOString(), progress: 0 },
    ])
    setText('')
    setAdding(false)
  }

  function toggleDone(id: string) {
    persist(goals.map((g) => g.id === id ? { ...g, done: !g.done, progress: !g.done ? 100 : g.progress } : g))
  }

  function setProgress(id: string, value: number) {
    persist(goals.map((g) => g.id === id ? { ...g, progress: Math.max(0, Math.min(100, value)) } : g))
  }

  function deleteGoal(id: string) {
    persist(goals.filter((g) => g.id !== id))
  }

  const active = goals.filter((g) => !g.done)
  const previous = goals.filter((g) => g.done)
  const shown = tab === 'aktiva' ? active : previous

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-stone-100">
        <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
          Mer
        </button>
        <h1 className="text-2xl font-bold text-stone-900">Mina mål</h1>

        {/* Tabs */}
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
            <div className="flex justify-center mb-3">
              <TargetIcon className="w-12 h-12 stroke-stone-200" />
            </div>
            <p className="text-stone-400 text-sm">
              {tab === 'aktiva' ? 'Inga aktiva mål ännu.' : 'Inga avklarade mål ännu.'}
            </p>
          </div>
        )}

        {shown.map((goal) => (
          <div key={goal.id} className="bg-white rounded-2xl border border-stone-100 p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <button
                onClick={() => toggleDone(goal.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  goal.done ? 'bg-forest-600' : 'bg-forest-50'
                }`}
              >
                <TargetIcon className={`w-5 h-5 ${goal.done ? 'stroke-white' : 'stroke-forest-600'}`} />
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold text-stone-900 ${goal.done ? 'line-through text-stone-400' : ''}`}>
                  {goal.text}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">Framsteg</p>

                {/* Progress bar */}
                <div
                  className="mt-2 cursor-pointer"
                  onClick={() => !goal.done && setEditingProgress(editingProgress === goal.id ? null : goal.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-stone-400">
                      {goal.done ? 'Avklarad' : `${goal.progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2">
                    <div
                      className="bg-forest-600 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Progress editor */}
                {editingProgress === goal.id && !goal.done && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setProgress(goal.id, goal.progress - 10)}
                      className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 font-bold text-sm flex items-center justify-center"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center text-sm font-semibold text-stone-900">{goal.progress}%</div>
                    <button
                      onClick={() => setProgress(goal.id, goal.progress + 10)}
                      className="w-8 h-8 rounded-lg bg-forest-600 text-white font-bold text-sm flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Delete */}
              <button onClick={() => deleteGoal(goal.id)} className="p-1 -mr-1 -mt-1">
                <XIcon className="w-4 h-4 stroke-stone-300" />
              </button>
            </div>
          </div>
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
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => addGoal(s)}
                  className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full hover:bg-forest-50 hover:text-forest-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium">
                Avbryt
              </button>
              <button onClick={() => addGoal(text)} className="flex-1 py-2.5 rounded-xl bg-forest-600 text-white text-sm font-semibold">
                Lägg till
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add button — fixed */}
      {tab === 'aktiva' && !adding && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg px-5 pb-6 pt-3 bg-gradient-to-t from-stone-50">
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-forest-600 text-white rounded-2xl text-sm font-semibold shadow-lg"
          >
            <PlusIcon className="w-4 h-4 stroke-white" />
            Lägg till nytt mål
          </button>
        </div>
      )}
    </div>
  )
}
