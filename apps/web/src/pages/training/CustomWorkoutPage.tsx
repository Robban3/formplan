import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon, XIcon, PlayIcon, DumbbellIcon } from '../../components/ui/Icons'
import { workoutStore } from '../../store/workoutStore'
import type { ExerciseLog } from '../../store/workoutStore'
import { isCardioExercise, exerciseUsesWeight } from '../../lib/exerciseLog'
import { EXERCISE_CATALOG, EXERCISE_CATEGORIES } from '../../lib/exerciseCatalog'
import { resolveExercise } from '../../lib/exerciseResolve'
import { normalizeExerciseName } from '../../lib/exerciseKey'

interface Exercise {
  name: string
  /** Katalog-id när övningen kommer från katalogen — ger rätt bild och historiknyckel. */
  exercise_id?: string
  sets: number
  reps: string
  rest_seconds: number
  weight_kg?: number | null
}
interface CustomWorkout { id: string; name: string; exercises: Exercise[]; createdAt: string }

const KEY = 'formplan_custom_workouts'

function loadWorkouts(): CustomWorkout[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CustomWorkout[] }
  catch { return [] }
}
function saveWorkouts(ws: CustomWorkout[]) { localStorage.setItem(KEY, JSON.stringify(ws)) }

/**
 * Förslagen härleds ur katalogen i stället för en handskriven namnlista. En
 * handskriven lista kan innehålla namn som inte finns i katalogen (t.ex.
 * "Triceps dips") — då fick övningen fel eller ingen bild. Id:t sparas på
 * övningen, så uppslagningen sedan är exakt i stället för luddig.
 */
const CATEGORY_ORDER = new Map<string, number>(EXERCISE_CATEGORIES.map((c, i) => [c, i]))
const EXERCISE_PRESETS: { id: string; name: string }[] = [...EXERCISE_CATALOG]
  .sort(
    (a, b) =>
      (CATEGORY_ORDER.get(a.category) ?? 99) - (CATEGORY_ORDER.get(b.category) ?? 99) ||
      a.name.localeCompare(b.name, 'sv')
  )
  .map((ex) => ({ id: ex.id, name: ex.name }))

export function CustomWorkoutPage() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState<CustomWorkout[]>(loadWorkouts)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [addingEx, setAddingEx] = useState(false)
  const [exName, setExName] = useState('')
  // Id:t sätts när övningen valts bland förslagen; fritext löses upp vid tillägg.
  const [exId, setExId] = useState<string | null>(null)
  const [exSets, setExSets] = useState('3')
  const [exReps, setExReps] = useState('10')
  const [exRest, setExRest] = useState('60')
  const [exWeight, setExWeight] = useState('')
  const [exError, setExError] = useState<string | null>(null)

  function reload() { setWorkouts(loadWorkouts()) }

  function resetExerciseForm() {
    setExName('')
    setExId(null)
    setExWeight('')
    setExError(null)
  }

  function addExercise() {
    const n = exName.trim()
    if (!n) return
    // Ett namn som varken matchar katalogen ELLER innehåller något
    // betydelsebärande tecken (t.ex. "💪") skulle normaliseras till tomt och
    // därmed dela historiknyckel med varje annan sådan övning.
    const catalog = resolveExercise({ name: n, exercise_id: exId })
    if (!catalog && normalizeExerciseName(n) === '') {
      setExError('Ange ett övningsnamn med bokstäver eller siffror.')
      return
    }
    const w = parseFloat(exWeight)
    const name = catalog?.name ?? n
    setExercises((prev) => [...prev, {
      name,
      ...(catalog ? { exercise_id: catalog.id } : {}),
      sets: parseInt(exSets, 10) || 3,
      reps: exReps || '10',
      rest_seconds: parseInt(exRest, 10) || 60,
      weight_kg: !isCardioExercise(name) && exerciseUsesWeight(name) && w > 0 ? w : null,
    }])
    resetExerciseForm()
    setAddingEx(false)
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
      // Följer med genom hela passet: bild, historik och personbästa nycklas
      // på katalog-id:t i stället för att gissas fram ur namnet.
      exerciseId: ex.exercise_id,
      targetSets: ex.sets,
      targetReps: ex.reps,
      restSeconds: ex.rest_seconds,
      sets: Array.from({ length: ex.sets }, () => ({ reps: 0, weight_kg: ex.weight_kg ?? null, done: false })),
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

  const q = exName.trim().toLowerCase()
  const suggestions = EXERCISE_PRESETS.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 40)

  return (
    <div className="pb-10">
      <div className="px-5 pt-header pb-4 bg-white border-b border-stone-100">
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
            <button onClick={() => setCreating(true)} className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center">
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
                  value={exName}
                  onChange={(e) => { setExName(e.target.value); setExId(null); setExError(null) }}
                  className="w-full bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                />

                {/* Alltid synliga förslag att välja bland */}
                {suggestions.length > 0 && (
                  <div className="max-h-32 overflow-y-auto flex flex-wrap gap-1.5">
                    {suggestions.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => {
                          setExName(ex.name)
                          setExId(ex.id)
                          setExWeight('')
                          setExError(null)
                          if (isCardioExercise(ex.name)) { setExSets('1'); setExReps('20') }
                          else { setExSets('3'); setExReps('10') }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          exId === ex.id
                            ? 'bg-forest-700 text-white border-forest-700'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-forest-300'
                        }`}
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                )}

                {exName.trim() && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="min-w-0">
                        <label className="text-xs text-stone-500">Set</label>
                        <input type="number" value={exSets} onChange={(e) => setExSets(e.target.value)}
                          className="mt-1 w-full bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
                      </div>
                      <div className="min-w-0">
                        <label className="text-xs text-stone-500">{isCardioExercise(exName) ? 'Tid (min)' : 'Reps'}</label>
                        <input value={exReps} onChange={(e) => setExReps(e.target.value)}
                          className="mt-1 w-full bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
                      </div>
                      <div className="min-w-0">
                        <label className="text-xs text-stone-500">Vila (sek)</label>
                        <input type="number" value={exRest} onChange={(e) => setExRest(e.target.value)}
                          className="mt-1 w-full bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
                      </div>
                    </div>

                    {!isCardioExercise(exName) && exerciseUsesWeight(exName) && (
                      <div>
                        <label className="text-xs text-stone-500">Vikt (kg, valfritt)</label>
                        <input type="number" inputMode="decimal" value={exWeight} placeholder="t.ex. 60"
                          onChange={(e) => setExWeight(e.target.value)}
                          className="mt-1 w-full bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
                      </div>
                    )}
                  </>
                )}
                {exError && <p className="text-xs text-red-500">{exError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setAddingEx(false); resetExerciseForm() }}
                    className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm">
                    Avbryt
                  </button>
                  <button onClick={addExercise} disabled={!exName.trim()}
                    className="flex-1 py-2 rounded-xl bg-forest-700 text-white text-sm font-semibold disabled:opacity-40">
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
              className="w-full py-3 bg-forest-700 text-white font-bold rounded-xl disabled:opacity-40"
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
              className="w-full flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold py-3 transition-colors"
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
