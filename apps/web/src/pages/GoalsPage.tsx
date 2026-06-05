import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon, XIcon } from '../components/ui/Icons'
import { settingsStore } from '../lib/settings'
import { useSettings } from '../hooks/useSettings'

interface Goal {
  id: string
  text: string
  done: boolean
  createdAt: string
}

const STORAGE_KEY = 'formplan_goals'

function loadGoals(): Goal[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Goal[]
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

export function GoalsPage() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState<Goal[]>(loadGoals)
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')

  function persist(updated: Goal[]) {
    setGoals(updated)
    saveGoals(updated)
  }

  function addGoal(t: string) {
    if (!t.trim()) return
    persist([
      ...goals,
      { id: crypto.randomUUID(), text: t.trim(), done: false, createdAt: new Date().toISOString() },
    ])
    setText('')
    setAdding(false)
  }

  function toggleGoal(id: string) {
    persist(goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)))
  }

  function deleteGoal(id: string) {
    persist(goals.filter((g) => g.id !== id))
  }

  const active = goals.filter((g) => !g.done)
  const done = goals.filter((g) => g.done)

  return (
    <div className="px-5 pt-12 pb-4">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Mina mål</h1>
      <p className="text-stone-400 text-sm mb-5">Sätt upp personliga mål och bocka av dem.</p>

      {active.length === 0 && !adding && (
        <p className="text-center text-stone-400 text-sm py-6">Inga aktiva mål ännu.</p>
      )}

      {active.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden mb-4">
          {active.map((g, i) => (
            <div key={g.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-stone-50' : ''}`}>
              <button
                onClick={() => toggleGoal(g.id)}
                className="w-5 h-5 rounded-full border-2 border-stone-300 flex-shrink-0 hover:border-forest-600 transition-colors"
              />
              <span className="flex-1 text-sm text-stone-800">{g.text}</span>
              <button onClick={() => deleteGoal(g.id)}>
                <XIcon className="w-4 h-4 stroke-stone-300" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3 mb-4">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGoal(text)}
            placeholder="Beskriv ditt mål…"
            className="w-full bg-stone-100 rounded-xl px-4 py-3 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          {/* Suggestions */}
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
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-xl text-sm text-forest-600 font-medium hover:bg-forest-50 transition-colors mb-4"
        >
          <PlusIcon className="w-4 h-4 stroke-forest-600" />
          Nytt mål
        </button>
      )}

      {done.length > 0 && (
        <>
          <p className="text-xs text-stone-400 font-medium mb-2">KLARA MÅL</p>
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            {done.map((g, i) => (
              <div key={g.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-stone-50' : ''}`}>
                <button
                  onClick={() => toggleGoal(g.id)}
                  className="w-5 h-5 rounded-full bg-forest-600 border-2 border-forest-600 flex-shrink-0 flex items-center justify-center"
                >
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="flex-1 text-sm text-stone-400 line-through">{g.text}</span>
                <button onClick={() => deleteGoal(g.id)}>
                  <XIcon className="w-4 h-4 stroke-stone-300" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
