import { useEffect, useState } from 'react'
import { workoutApi, type WorkoutSession } from '../lib/workoutApi'
import { sessionsThisWeek, weeklyCounts } from '../lib/derive'

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.round((totalSeconds % 3600) / 60)
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

export function AnalyticsPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    workoutApi
      .getSessions()
      .then(({ sessions }) => setSessions(sessions))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

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

  const stats = [
    { label: 'Pass denna vecka', value: String(thisWeek) },
    { label: 'Totalt antal pass', value: String(sessions.length) },
    { label: 'Total volym', value: `${Math.round(totalVolume).toLocaleString('sv-SE')} kg` },
    { label: 'Total tid', value: formatDuration(totalTime) },
  ]

  return (
    <div className="px-5 pt-12 pb-4 space-y-4">
      <h1 className="text-2xl font-bold text-stone-900">Analys</h1>

      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📊</div>
          <h2 className="text-lg font-semibold mb-1">Ingen data ännu</h2>
          <p className="text-stone-400 text-sm">Genomför ditt första pass så dyker statistiken upp här.</p>
        </div>
      ) : (
        <>
          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-stone-100 p-4">
                <p className="text-2xl font-bold text-stone-900">{s.value}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Weekly bar chart */}
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

          {/* Recent sessions */}
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <p className="font-semibold text-stone-800 px-4 py-3 border-b border-stone-50">Senaste pass</p>
            {sessions.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-stone-800">{s.workout_name}</p>
                  <p className="text-xs text-stone-400">
                    {new Date(s.completed_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                    {' · '}
                    {s.completed_sets} set · {formatDuration(s.duration_seconds)}
                  </p>
                </div>
                <span className="text-xs text-stone-500">{Math.round(s.total_volume_kg)} kg</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
