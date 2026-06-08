import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon, XIcon, PlayIcon, DumbbellIcon } from '../../components/ui/Icons'
import { workoutStore } from '../../store/workoutStore'
import type { ExerciseLog } from '../../store/workoutStore'

interface Exercise { name: string; sets: number; reps: string; rest_seconds: number }
interface CustomWorkout { id: string; name: string; exercises: Exercise[]; createdAt: string }

const KEY = 'formplan_custom_workouts'

function loadWorkouts(): CustomWorkout[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CustomWorkout[] }
  catch { return [] }
}
function saveWorkouts(ws: CustomWorkout[]) { localStorage.setItem(KEY, JSON.stringify(ws)) }

const EXERCISE_PRESETS = [
  'Knäböj','Bänkpress','Marklyft','Axelpress','Hantelrodd','Lat pulldown',
  'Bicep curl','Triceps dips','Utfallsgång','Hip thrust','Vadpress',
  'Push-ups','Pull-ups','Plankan','Rygglyft','Sit-ups',
  'Kettlebell swings','Farmer walk','Goblet squat','Romanian deadlift',
]

export function CustomWorkoutPage() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState<CustomWorkout[]>(loadWorkouts)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [addingEx, setAddingEx] = useState(false)
  const [exName, setExName] = useState('')
  const [exSets, setExSets] = useState('3')
  const [exReps, setExReps] = useState('10')
  const [exRest, setExRest] = useState('60')
  const [search, setSearch] = useState('')

  function reload() { setWorkouts(loadWorkouts()) }

  function addExercise() {
    if (!exName.trim()) return
    setExercises((prev) => [...prev, {
      name: exName.trim(),
      sets: parseInt(exSets) || 3,
      reps: exReps || '10',
      rest_seconds: parseInt(exRest) || 60,
    }])
    setExName(''); setSearch(''); setAddingEx(false)
  }

  function saveWorkout() {
    if (!name.trim() || exercises.length === 0) return
    const ws = loadWorkouts()
    const w: CustomWorkout = { id: crypto.randomUUID(), name: name.trim(), exercises, createdAt: new Date().toISOString() }
    saveWorkouts([w, ...ws])
    reload()
    setCreating(false); setName(''); setExercises([])
  }

  function deleteWorkout(id: string) {
    saveWorkouts(loadWorkouts().filter((w) => w.id !== id))
    reload()
  }

  function startWorkout(w: CustomWorkout) {
    const exLogs: ExerciseLog[] = w.exercises.map((ex) => ({
      name: ex.name,
      targetSets: ex.sets,
      targetReps: ex.reps,
      restSeconds: ex.rest_seconds,
      sets: Array.from({ length: ex.sets }, () => ({ reps: 0, weight_kg: null, done: false })),
    }))
    workoutStore.start({
      planDayId: `custom-${w.id}`,
      workoutName: w.name,
      startedAt: Date.now(),
      exercises: exLogs,
      currentExerciseIndex: 0,
    })
    navigate(`/workout/custom-${w.id}/active`)
  }

  const filtered = EXERCISE_PRESETS.filter((e) => e.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="pb-10">
      <div className="px-5 pt-12 pb-4 bg-white border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
          Träning
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Egna pass</h1>
            <p className="text-sm text-stone-400 mt-0.5">Bygg dina egna träningspass</p>
          </div>
          {!creating && (
            <button onClick={() => setCreating(true)} className="w-10 h-10 bg-forest-600 rounded-xl flex items-center justify-center">
              <PlusIcon className="w-5 h-5 stroke-white" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {/* Create form */}
        {creating && (
          <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-stone-900">Nytt pass</p>
              <button onClick={() => { setCreating(false); setExercises([]) }}>
                <XIcon className="w-4 h-4 stroke-stone-400" />
              </button>
            </div>

            <input
              placeholder="Passnamn (t.ex. Push-dag)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
            />

            {/* Exercise list */}
            {exercises.length > 0 && (
              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2">
                    <DumbbellIcon className="w-4 h-4 stroke-forest-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800">{ex.name}</p>
                      <p className="text-xs text-stone-400">{ex.sets} set × {ex.reps} reps · {ex.rest_seconds}s vila</p>
                    </div>
                    <button onClick={() => setExercises((prev) => prev.filter((_, j) => j !== i))}>
                      <XIcon className="w-4 h-4 stroke-stone-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add exercise */}
            {addingEx ? (
              <div className="bg-stone-50 rounded-xl p-3 space-y-3">
                <input
                  autoFocus
                  placeholder="Sök eller skriv övning…"
                  value={search || exName}
                  onChange={(e) => { setSearch(e.target.value); setExName(e.target.value) }}
                  className="w-full bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                />
                {search && filtered.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filtered.slice(0, 8).map((ex) => (
                      <button key={ex} onClick={() => { setExName(ex); setSearch('') }}
                        className="w-full text-left text-sm text-stone-700 py-1.5 px-2 hover:bg-white rounded-lg">
                        {ex}
                      </button>
                    ))}
                  </div>
                )}
                {exName && !search && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-stone-500">Set</label>
                      <input type="number" value={exSets} onChange={(e) => setExSets(e.target.value)}
                        className="mt-1 w-full bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Reps</label>
                      <input value={exReps} onChange={(e) => setExReps(e.target.value)}
                        className="mt-1 w-full bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Vila (sek)</label>
                      <input type="number" value={exRest} onChange={(e) => setExRest(e.target.value)}
                        className="mt-1 w-full bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setAddingEx(false); setExName(''); setSearch('') }}
                    className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm">
                    Avbryt
                  </button>
                  <button onClick={addExercise} disabled={!exName.trim()}
                    className="flex-1 py-2 rounded-xl bg-forest-600 text-white text-sm font-semibold disabled:opacity-40">
                    Lägg till
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingEx(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-stone-200 rounded-xl text-sm text-forest-600">
                <PlusIcon className="w-4 h-4 stroke-forest-600" />
                Lägg till övning
              </button>
            )}

            <button
              onClick={saveWorkout}
              disabled={!name.trim() || exercises.length === 0}
              className="w-full py-3 bg-forest-600 text-white font-bold rounded-xl disabled:opacity-40"
            >
              Spara pass
            </button>
          </div>
        )}

        {/* Saved workouts */}
        {workouts.length === 0 && !creating && (
          <div className="text-center py-16">
            <DumbbellIcon className="w-12 h-12 stroke-stone-200 mx-auto mb-3" />
            <p className="font-semibold text-stone-800">Inga egna pass ännu</p>
            <p className="text-sm text-stone-400 mt-1">Tryck på + för att bygga ditt första pass</p>
          </div>
        )}

        {workouts.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-bold text-stone-900">{w.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{w.exercises.length} övningar</p>
                </div>
                <button onClick={() => deleteWorkout(w.id)} className="p-1">
                  <XIcon className="w-4 h-4 stroke-stone-300" />
                </button>
              </div>
              <div className="flex gap-1.5 flex-wrap mt-3">
                {w.exercises.slice(0, 4).map((ex, i) => (
                  <span key={i} className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-lg">{ex.name}</span>
                ))}
                {w.exercises.length > 4 && (
                  <span className="text-xs bg-stone-100 text-stone-400 px-2 py-1 rounded-lg">+{w.exercises.length - 4}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => startWorkout(w)}
              className="w-full flex items-center justify-center gap-2 bg-forest-600 hover:bg-forest-700 text-white font-semibold py-3 transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
              Starta pass
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
