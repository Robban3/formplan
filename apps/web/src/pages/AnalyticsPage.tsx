import { useEffect, useState } from 'react'
import { workoutApi, type WorkoutSession } from '../lib/workoutApi'
import { nutritionApi } from '../lib/nutritionApi'
import { sessionsThisWeek, weeklyCounts, dateKey } from '../lib/derive'

type Tab = 'traning' | 'kost'

interface DaySummary {
  date: string
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  entries: number
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.round((totalSeconds % 3600) / 60)
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

function last7Days(): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 6)
  return { from: dateKey(from), to: dateKey(to) }
}

export function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('traning')
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [daySummaries, setDaySummaries] = useState<DaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [nutritionLoaded, setNutritionLoaded] = useState(false)

  useEffect(() => {
    workoutApi
      .getSessions()
      .then(({ sessions }) => setSessions(sessions))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  // Lazy-load nutrition data when the tab is first selected.
  useEffect(() => {
    if (tab !== 'kost' || nutritionLoaded) return
    setNutritionLoading(true)
    const { from, to } = last7Days()
    nutritionApi
      .getSummary(from, to)
      .then(({ days }) => setDaySummaries(days))
      .catch(() => setDaySummaries([]))
      .finally(() => {
        setNutritionLoading(false)
        setNutritionLoaded(true)
      })
  }, [tab, nutritionLoaded])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const completedAt = sessions.map((s) => s.completed_at)
  const thisWeek = sessionsThisWeek(completedAt)
  const totalVolume = sessions.reduce((s, w) => s + w.total_volume_kg, 0)
  const totalTime = sessions.reduce((s, w) => s + w.duration_seconds, 0)
  const weekly = weeklyCounts(completedAt, 8)
  const maxWeekly = Math.max(1, ...weekly)

  const trainStats = [
    { label: 'Pass denna vecka', value: String(thisWeek) },
    { label: 'Totalt antal pass', value: String(sessions.length) },
    { label: 'Total volym', value: `${Math.round(totalVolume).toLocaleString('sv-SE')} kg` },
    { label: 'Total tid', value: formatDuration(totalTime) },
  ]

  // 7-day calorie chart
  const maxKcal = Math.max(1, ...daySummaries.map((d) => d.kcal))
  const avgKcal = daySummaries.length > 0
    ? Math.round(daySummaries.reduce((s, d) => s + d.kcal, 0) / daySummaries.length)
    : 0

  return (
    <div className="pt-12 pb-4">
      <div className="px-5 mb-4">
        <h1 className="text-2xl font-bold text-stone-900">Analys</h1>
        <div className="flex gap-5 mt-3 border-b border-stone-100">
          {(['traning', 'kost'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium transition-colors ${
                tab === t ? 'text-forest-600 border-b-2 border-forest-600' : 'text-stone-400'
              }`}
            >
              {t === 'traning' ? 'Träning' : 'Kost'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'traning' && (
        <div className="px-5 space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📊</div>
              <h2 className="text-lg font-semibold mb-1">Ingen data ännu</h2>
              <p className="text-stone-400 text-sm">Genomför ditt första pass så dyker statistiken upp här.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {trainStats.map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-stone-100 p-4">
                    <p className="text-2xl font-bold text-stone-900">{s.value}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-stone-100 p-4">
                <p className="font-semibold text-stone-800 mb-4">Pass per vecka</p>
                <div className="flex items-end justify-between gap-2 h-32">
                  {weekly.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-stone-100 rounded-lg flex items-end h-full">
                        <div
                          className="w-full bg-forest-600 rounded-lg transition-all"
                          style={{ height: `${(count / maxWeekly) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {i === weekly.length - 1 ? 'Nu' : `-${weekly.length - 1 - i}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <p className="font-semibold text-stone-800 px-4 py-3 border-b border-stone-50">Senaste pass</p>
                {sessions.slice(0, 8).map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{s.workout_name}</p>
                      <p className="text-xs text-stone-400">
                        {new Date(s.completed_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                        {' · '}{s.completed_sets} set · {formatDuration(s.duration_seconds)}
                      </p>
                    </div>
                    <span className="text-xs text-stone-500">{Math.round(s.total_volume_kg)} kg</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'kost' && (
        <div className="px-5 space-y-4">
          {nutritionLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : daySummaries.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🥗</div>
              <h2 className="text-lg font-semibold mb-1">Ingen kostdata ännu</h2>
              <p className="text-stone-400 text-sm">Logga dina måltider så visas trenden här.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-stone-100 p-4">
                  <p className="text-2xl font-bold text-stone-900">{avgKcal.toLocaleString('sv-SE')}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Snitt kcal / dag</p>
                </div>
                <div className="bg-white rounded-2xl border border-stone-100 p-4">
                  <p className="text-2xl font-bold text-stone-900">{daySummaries.length}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Dagar loggade (7 dgr)</p>
                </div>
              </div>

              {/* 7-day calorie bar chart */}
              <div className="bg-white rounded-2xl border border-stone-100 p-4">
                <p className="font-semibold text-stone-800 mb-4">Kalorier senaste 7 dagar</p>
                <div className="flex items-end gap-2 h-32">
                  {daySummaries.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-stone-100 rounded-lg flex items-end h-full">
                        <div
                          className="w-full bg-amber-400 rounded-lg transition-all"
                          style={{ height: `${(d.kcal / maxKcal) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-stone-400">
                        {new Date(d.date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-day macro breakdown */}
              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <p className="font-semibold text-stone-800 px-4 py-3 border-b border-stone-50">Daglig uppdelning</p>
                {[...daySummaries].reverse().map((d) => (
                  <div key={d.date} className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-stone-800">
                        {new Date(d.date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-stone-400">
                        P {d.protein_g}g · K {d.carbs_g}g · F {d.fat_g}g
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-stone-700">{d.kcal} kcal</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
