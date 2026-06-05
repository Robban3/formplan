import { useEffect, useState } from 'react'
import { useLoadTimeout } from '../hooks/useLoadTimeout'
import { BarChartIcon, LeafIcon } from '../components/ui/Icons'
import { workoutApi, type WorkoutSession } from '../lib/workoutApi'
import { nutritionApi } from '../lib/nutritionApi'
import { sessionsCountThisWeek, weeklyCounts, dateKey } from '../lib/derive'
import { getLocalSessions, subscribeSessions } from '../lib/workoutSessionStore'
import { useUnits } from '../hooks/useUnits'

type Tab = 'oversikt' | 'trender' | 'kalorier'

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
  const { weightLabel, toDisplay } = useUnits()
  const [tab, setTab] = useState<Tab>('oversikt')
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [daySummaries, setDaySummaries] = useState<DaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [nutritionLoaded, setNutritionLoaded] = useState(false)

  useEffect(() => {
    function refreshLocal() {
      setSessions(getLocalSessions())
    }

    async function loadSessions() {
      refreshLocal()
      try {
        const { sessions } = await workoutApi.getSessions()
        setSessions(sessions ?? getLocalSessions())
      } catch {
        refreshLocal()
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
    return subscribeSessions(() => {
      refreshLocal()
      workoutApi.getSessions().then(({ sessions }) => {
        setSessions(sessions ?? getLocalSessions())
      }).catch(refreshLocal)
    })
  }, [])

  useLoadTimeout(setLoading)

  useEffect(() => {
    if ((tab !== 'kalorier' && tab !== 'trender') || nutritionLoaded) return
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
  const thisWeek = sessionsCountThisWeek(completedAt)
  const totalVolume = sessions.reduce((s, w) => s + w.total_volume_kg, 0)
  const totalTime = sessions.reduce((s, w) => s + w.duration_seconds, 0)
  const weekly = weeklyCounts(completedAt, 8)
  const maxWeekly = Math.max(1, ...weekly)

  const maxKcal = Math.max(1, ...daySummaries.map((d) => d.kcal))
  const avgKcal = daySummaries.length > 0
    ? Math.round(daySummaries.reduce((s, d) => s + d.kcal, 0) / daySummaries.length)
    : 0

  const avgProtein = daySummaries.length > 0
    ? Math.round(daySummaries.reduce((s, d) => s + d.protein_g, 0) / daySummaries.length)
    : 0
  const avgCarbs = daySummaries.length > 0
    ? Math.round(daySummaries.reduce((s, d) => s + d.carbs_g, 0) / daySummaries.length)
    : 0
  const avgFat = daySummaries.length > 0
    ? Math.round(daySummaries.reduce((s, d) => s + d.fat_g, 0) / daySummaries.length)
    : 0
  const macroTotal = avgProtein + avgCarbs + avgFat || 1
  const macroPct = {
    protein: Math.round((avgProtein / macroTotal) * 100),
    carbs: Math.round((avgCarbs / macroTotal) * 100),
    fat: Math.round((avgFat / macroTotal) * 100),
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'oversikt', label: 'Översikt' },
    { key: 'trender', label: 'Trender' },
    { key: 'kalorier', label: 'Kalorier' },
  ]

  return (
    <div className="pt-12 pb-4">
      <div className="px-5 mb-4">
        <h1 className="text-2xl font-bold text-stone-900">Analys</h1>
        <div className="flex gap-5 mt-3 border-b border-stone-100">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-3 text-sm font-medium transition-colors ${
                tab === key ? 'text-forest-600 border-b-2 border-forest-600' : 'text-stone-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ÖVERSIKT */}
      {tab === 'oversikt' && (
        <div className="px-5 space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-3">
                <BarChartIcon className="w-12 h-12 stroke-stone-300" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Ingen data ännu</h2>
              <p className="text-stone-400 text-sm">Genomför ditt första pass så dyker statistiken upp här.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Denna vecka</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pass', value: String(thisWeek) },
                  { label: 'Totalt antal pass', value: String(sessions.length) },
                  { label: 'Total volym', value: `${Math.round(toDisplay(totalVolume)).toLocaleString('sv-SE')} ${weightLabel}` },
                  { label: 'Total tid', value: formatDuration(totalTime) },
                ].map((s) => (
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
                    <span className="text-xs text-stone-500">{Math.round(toDisplay(s.total_volume_kg))} {weightLabel}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TRENDER */}
      {tab === 'trender' && (
        <div className="px-5 space-y-4">
          {nutritionLoading ? (
            <div className="flex justify-center h-32 items-center">
              <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : daySummaries.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-3">
                <LeafIcon className="w-12 h-12 stroke-stone-300" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Ingen kostdata ännu</h2>
              <p className="text-stone-400 text-sm">Logga dina måltider så visas trenden här.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-stone-100 p-4">
                <p className="font-semibold text-stone-800 mb-4">Kalorier senaste 7 dagar</p>
                {/* Line-style chart using SVG */}
                <svg viewBox={`0 0 ${daySummaries.length * 40} 80`} className="w-full h-24" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={daySummaries
                      .map((d, i) => `${i * 40 + 20},${80 - (d.kcal / maxKcal) * 70}`)
                      .join(' ')}
                  />
                  {daySummaries.map((d, i) => (
                    <circle
                      key={d.date}
                      cx={i * 40 + 20}
                      cy={80 - (d.kcal / maxKcal) * 70}
                      r="4"
                      fill="#16a34a"
                    />
                  ))}
                </svg>
                <div className="flex justify-between mt-1">
                  {daySummaries.map((d) => (
                    <span key={d.date} className="text-[9px] text-stone-400">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short' })}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-stone-100 p-4">
                  <p className="text-2xl font-bold text-stone-900">{avgKcal.toLocaleString('sv-SE')}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Snitt kcal / dag</p>
                </div>
                <div className="bg-white rounded-2xl border border-stone-100 p-4">
                  <p className="text-2xl font-bold text-stone-900">{daySummaries.length}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Dagar loggade</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* KALORIER */}
      {tab === 'kalorier' && (
        <div className="px-5 space-y-4">
          {nutritionLoading ? (
            <div className="flex justify-center h-32 items-center">
              <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : daySummaries.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-3">
                <LeafIcon className="w-12 h-12 stroke-stone-300" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Ingen kostdata ännu</h2>
              <p className="text-stone-400 text-sm">Logga dina måltider så visas trenden här.</p>
            </div>
          ) : (
            <>
              {/* Macro donut (SVG) */}
              <div className="bg-white rounded-2xl border border-stone-100 p-4">
                <p className="font-semibold text-stone-800 mb-4">Makronutrienter (snitt)</p>
                <div className="flex items-center gap-6">
                  <MacroDonut protein={macroPct.protein} carbs={macroPct.carbs} fat={macroPct.fat} />
                  <div className="space-y-2">
                    {[
                      { label: 'Protein', value: avgProtein, pct: macroPct.protein, color: 'bg-forest-500' },
                      { label: 'Fett', value: avgFat, pct: macroPct.fat, color: 'bg-sky-400' },
                      { label: 'Kolhydrater', value: avgCarbs, pct: macroPct.carbs, color: 'bg-amber-400' },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${m.color} flex-shrink-0`} />
                        <span className="text-xs text-stone-600">{m.label}</span>
                        <span className="text-xs text-stone-400 ml-auto">{m.value}g ({m.pct}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Daily calorie bars */}
              <div className="bg-white rounded-2xl border border-stone-100 p-4">
                <p className="font-semibold text-stone-800 mb-4">Kalorier per dag</p>
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

              {/* Per-day list */}
              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <p className="font-semibold text-stone-800 px-4 py-3 border-b border-stone-50">Daglig uppdelning</p>
                {[...daySummaries].reverse().map((d) => (
                  <div key={d.date} className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-stone-800 capitalize">
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

function MacroDonut({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const r = 36
  const cx = 44
  const cy = 44
  const circ = 2 * Math.PI * r
  const total = protein + carbs + fat || 1

  const segments = [
    { pct: protein / total, color: '#22c55e' },
    { pct: fat / total, color: '#38bdf8' },
    { pct: carbs / total, color: '#fbbf24' },
  ]

  let offset = 0
  return (
    <svg width={cx * 2} height={cy * 2} className="flex-shrink-0">
      {segments.map((seg, i) => {
        const dash = seg.pct * circ
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={10}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset * circ / 1 + circ * 0.25}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ strokeDashoffset: circ * 0.25 - offset * circ }}
          />
        )
        offset += seg.pct
        return el
      })}
    </svg>
  )
}
