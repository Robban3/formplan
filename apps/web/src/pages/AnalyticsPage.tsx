import { useEffect, useState } from 'react'
import { useLoadTimeout } from '../hooks/useLoadTimeout'
import { BarChartIcon, LeafIcon, PlusIcon, XIcon, DropletIcon, DumbbellIcon } from '../components/ui/Icons'
import { workoutApi, type WorkoutSession } from '../lib/workoutApi'
import { nutritionApi } from '../lib/nutritionApi'
import { sessionsCountThisWeek, weeklyCounts, dateKey } from '../lib/derive'
import { getLocalSessions, subscribeSessions, syncSessionsFromApi } from '../lib/workoutSessionStore'
import { getLocalWater, getLocalWaterSummary } from '../lib/waterStore'
import { getWeightEntries, addWeightEntry, deleteWeightEntry, type WeightEntry } from '../lib/weightStore'
import { getRpeEntries } from '../lib/rpeStore'
import { useSettings } from '../hooks/useSettings'

type Tab = 'oversikt' | 'trender' | 'kalorier'

interface DaySummary {
  date: string; kcal: number; protein_g: number; fat_g: number; carbs_g: number; entries: number
}

function fmt(seconds: number) {
  if (seconds < 60) return `${seconds} sek`
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}
function last7Dates(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return dateKey(d)
  })
}
function getISOWeek(date: Date) {
  const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const w1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7)
}
function deduplicate(sessions: WorkoutSession[]) {
  const seen = new Set<string>()
  return sessions.filter((s) => {
    const key = `${s.plan_day_id ?? s.workout_name}-${s.completed_at.slice(0, 10)}`
    if (seen.has(key)) return false; seen.add(key); return true
  })
}

// ── Ring chart ────────────────────────────────────────────────────────────────

function Ring({
  value, goal, color, size = 56, strokeWidth = 6, children
}: {
  value: number; goal: number; color: string; size?: number; strokeWidth?: number; children?: React.ReactNode
}) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      {children}
    </svg>
  )
}

function StatRing({
  Icon, label, value, unit, goal, goalLabel, color, iconStroke
}: {
  Icon: React.ComponentType<{className?: string}>; label: string
  value: number; unit: string; goal: number; goalLabel: string
  color: string; iconStroke: string
}) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-3 flex flex-col items-center gap-2">
      <div className="relative">
        <Ring value={value} goal={goal} color={color} size={72} strokeWidth={7}>
          <foreignObject x="16" y="16" width="40" height="40">
            <div className="w-full h-full flex items-center justify-center">
              <Icon className={`w-5 h-5 ${iconStroke}`} />
            </div>
          </foreignObject>
        </Ring>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ backgroundColor: color }}>
          {Math.round(pct)}%
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-stone-900">
          {unit === 'L'
            ? `${(value / 1000).toFixed(1).replace('.', ',')} ${unit}`
            : `${value.toLocaleString('sv-SE')} ${unit}`}
        </p>
        <p className="text-[10px] text-stone-400">{label}</p>
        <p className="text-[9px] text-stone-300">mål: {goalLabel}</p>
      </div>
    </div>
  )
}

// ── Weekly bar chart ──────────────────────────────────────────────────────────

function WeeklyBars({ weekly }: { weekly: number[] }) {
  const max = Math.max(1, ...weekly)
  const now = new Date()
  return (
    <div className="flex items-end justify-between gap-1 h-24">
      {weekly.map((count, i) => {
        const weeksAgo = weekly.length - 1 - i
        const isNow = weeksAgo === 0
        const d = new Date(now); d.setDate(d.getDate() - weeksAgo * 7)
        const label = isNow ? 'Nu' : `v.${getISOWeek(d)}`
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            {count > 0 && <span className="text-[9px] font-bold text-forest-600">{count}</span>}
            <div className="w-full bg-stone-100 rounded-sm flex items-end" style={{ height: '72px' }}>
              <div
                className={`w-full rounded-sm transition-all ${isNow ? 'bg-forest-600' : 'bg-forest-300'}`}
                style={{ height: `${Math.max((count / max) * 100, count > 0 ? 6 : 0)}%` }}
              />
            </div>
            <span className={`text-[9px] truncate w-full text-center ${isNow ? 'text-forest-600 font-semibold' : 'text-stone-400'}`}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Line chart ────────────────────────────────────────────────────────────────

function LineChart({
  points, color = '#22e6c6', height = 72, showDots = true, showArea = true
}: {
  points: number[]; color?: string; height?: number; showDots?: boolean; showArea?: boolean
}) {
  if (points.length < 2) return null
  const W = 280; const H = height; const pad = 12
  const min = Math.min(...points); const max = Math.max(...points)
  const range = max - min || 1
  const fx = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2)
  const fy = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2)
  const pts = points.map((v, i) => `${fx(i)},${fy(v)}`).join(' ')
  const id = `lg-${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && (
        <polygon points={`${fx(0)},${H} ${pts} ${fx(points.length - 1)},${H}`} fill={`url(#${id})`} />
      )}
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {showDots && points.map((v, i) => (
        <circle key={i} cx={fx(i)} cy={fy(v)} r="3.5" fill={color} />
      ))}
    </svg>
  )
}

// ── Macro donut ───────────────────────────────────────────────────────────────

function MacroDonut({ protein, carbs, fat, kcal }: { protein: number; carbs: number; fat: number; kcal: number }) {
  const r = 52; const cx = 64; const cy = 64; const circ = 2 * Math.PI * r
  const total = protein + carbs + fat || 1
  const segs = [
    { label: 'Protein', g: protein, pct: protein / total, color: '#22e6c6' },
    { label: 'Fett',    g: fat,     pct: fat / total,     color: '#38bdf8' },
    { label: 'Kolh.',   g: carbs,   pct: carbs / total,   color: '#fbbf24' },
  ]
  let cum = 0
  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0">
        <svg width={cx * 2} height={cy * 2}>
          {segs.map((seg, i) => {
            const offset = circ * 0.25 - cum * circ
            const el = (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={seg.color} strokeWidth={14}
                strokeDasharray={`${seg.pct * circ} ${circ}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )
            cum += seg.pct; return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-stone-900">{kcal.toLocaleString('sv-SE')}</span>
          <span className="text-[10px] text-stone-400">kcal/dag</span>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        {segs.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between mb-1 text-xs">
              <span className="font-medium text-stone-700">{s.label}</span>
              <span className="text-stone-400">{s.g}g · {Math.round(s.pct * 100)}%</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full" style={{ width: `${s.pct * 100}%`, backgroundColor: s.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Multi-line chart (for weight + rolling avg) ───────────────────────────────

function MultiLineChart({
  series, height = 80
}: {
  series: { points: number[]; color: string; dash?: boolean }[]
  height?: number
}) {
  const allPts = series.flatMap((s) => s.points)
  if (allPts.length < 2) return null
  const W = 280; const H = height; const pad = 12
  const min = Math.min(...allPts); const max = Math.max(...allPts)
  const range = max - min || 1
  const n = Math.max(...series.map((s) => s.points.length))
  const fx = (i: number) => pad + (i / Math.max(n - 1, 1)) * (W - pad * 2)
  const fy = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {series.map((s, si) => {
        const pts = s.points.map((v, i) => `${fx(i)},${fy(v)}`).join(' ')
        return (
          <polyline
            key={si}
            fill="none"
            stroke={s.color}
            strokeWidth={s.dash ? 1.5 : 2}
            strokeDasharray={s.dash ? '4 3' : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pts}
            opacity={s.dash ? 0.7 : 1}
          />
        )
      })}
      {series[0]?.points.map((v, i) => (
        <circle key={i} cx={fx(i)} cy={fy(v)} r="3" fill={series[0]?.color ?? '#22e6c6'} />
      ))}
    </svg>
  )
}

// ── Weight chart ──────────────────────────────────────────────────────────────

function rollingAvg(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1)
    return slice.reduce((s, v) => s + v, 0) / slice.length
  })
}

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) return null
  const change = entries[entries.length - 1]!.weight_kg - entries[0]!.weight_kg
  const sign = change > 0 ? '+' : ''
  const color = change < 0 ? '#22e6c6' : change > 0 ? '#ef4444' : '#6b7280'
  const rawPts = entries.map((e) => e.weight_kg)
  const avgPts = rollingAvg(rawPts, 7)
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold" style={{ color }}>
          {sign}{change.toFixed(1).replace('.', ',')} kg
        </span>
        <span className="text-sm text-stone-400">förändring sedan start</span>
      </div>
      <div className="flex gap-4 mb-3 text-[10px] text-stone-400">
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-forest-500 rounded" />Faktisk vikt</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-amber-400 rounded opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(to right, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 7px)' }} />7-dagars snitt</span>
      </div>
      <MultiLineChart
        series={[
          { points: rawPts, color: '#22e6c6' },
          { points: avgPts, color: '#f59e0b', dash: true },
        ]}
        height={80}
      />
      <div className="flex justify-between mt-1 text-[9px] text-stone-400">
        <span>{fmtDate(entries[0]!.date)}</span>
        <span>{entries[entries.length - 1]!.weight_kg.toFixed(1)} kg · {fmtDate(entries[entries.length - 1]!.date)}</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const settings = useSettings()
  const [tab, setTab] = useState<Tab>('oversikt')
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [daySummaries, setDaySummaries] = useState<DaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [nutritionLoaded, setNutritionLoaded] = useState(false)
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(getWeightEntries)
  const rpeEntries = getRpeEntries()
  const [weightInput, setWeightInput] = useState('')
  const [showWeightInput, setShowWeightInput] = useState(false)

  const today = dateKey()
  const waterToday = getLocalWater(today).total_ml
  const waterDays = getLocalWaterSummary(
    (() => { const d = new Date(); d.setDate(d.getDate() - 6); return dateKey(d) })(),
    today
  ).days
  const last7 = last7Dates()

  useEffect(() => {
    function refreshLocal() { setSessions(deduplicate(getLocalSessions())) }
    async function loadSessions() {
      refreshLocal()
      try {
        const { sessions } = await workoutApi.getSessions()
        if (sessions?.length) syncSessionsFromApi(sessions)
        setSessions(deduplicate(sessions ?? getLocalSessions()))
      } catch { refreshLocal() }
      finally { setLoading(false) }
    }
    loadSessions()
    return subscribeSessions(() => {
      refreshLocal()
      workoutApi.getSessions()
        .then(({ sessions }) => setSessions(deduplicate(sessions ?? getLocalSessions())))
        .catch(refreshLocal)
    })
  }, [])

  useLoadTimeout(setLoading)

  useEffect(() => {
    if (tab !== 'kalorier' || nutritionLoaded) return
    setNutritionLoading(true)
    const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 6)
    nutritionApi.getSummary(dateKey(from), dateKey(to))
      .then(({ days }) => setDaySummaries(days))
      .catch(() => setDaySummaries([]))
      .finally(() => { setNutritionLoading(false); setNutritionLoaded(true) })
  }, [tab, nutritionLoaded])

  function logWeight() {
    const kg = parseFloat(weightInput.replace(',', '.'))
    if (!kg || kg < 20 || kg > 300) return
    addWeightEntry(kg); setWeightEntries(getWeightEntries()); setWeightInput(''); setShowWeightInput(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Computed values
  const completedAt = sessions.map((s) => s.completed_at)
  const thisWeek = sessionsCountThisWeek(completedAt)
  const weekly = weeklyCounts(completedAt, 8)
  const thisWeekSessions = sessions.filter((s) => {
    const d = new Date(s.completed_at); const now = new Date()
    const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0,0,0,0)
    return d >= monday
  })
  const thisWeekTime = thisWeekSessions.reduce((s, w) => s + w.duration_seconds, 0)
  const weeklyGoal = 5

  const avgKcal = daySummaries.length > 0 ? Math.round(daySummaries.reduce((s, d) => s + d.kcal, 0) / daySummaries.length) : 0
  const avgProtein = daySummaries.length > 0 ? Math.round(daySummaries.reduce((s, d) => s + d.protein_g, 0) / daySummaries.length) : 0
  const avgCarbs = daySummaries.length > 0 ? Math.round(daySummaries.reduce((s, d) => s + d.carbs_g, 0) / daySummaries.length) : 0
  const avgFat = daySummaries.length > 0 ? Math.round(daySummaries.reduce((s, d) => s + d.fat_g, 0) / daySummaries.length) : 0
  const maxKcal = Math.max(1, ...daySummaries.map((d) => d.kcal))

  // Water 7-day chart data (one value per day, 0 if not logged)
  const waterPoints = last7.map((date) => waterDays.find((d) => d.date === date)?.total_ml ?? 0)
  const avgWater = waterDays.length > 0 ? Math.round(waterDays.reduce((s, d) => s + d.total_ml, 0) / waterDays.length) : 0

  const TABS = [
    { key: 'oversikt' as Tab, label: 'Översikt' },
    { key: 'trender'  as Tab, label: 'Trender' },
    { key: 'kalorier' as Tab, label: 'Kalorier' },
  ]

  return (
    <div className="pt-12 pb-6">
      {/* Header */}
      <div className="px-5 mb-4">
        <h1 className="text-2xl font-bold text-stone-900">Analys</h1>
        <div className="flex gap-5 mt-3 border-b border-stone-100">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`pb-3 text-sm font-medium transition-colors ${tab === key ? 'text-forest-600 border-b-2 border-forest-600' : 'text-stone-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ ÖVERSIKT ══════════════════════════════════════════════════════════ */}
      {tab === 'oversikt' && (
        <div className="px-5 space-y-4">
          {/* Ringar — Träning, Vatten, Tid */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Denna vecka</p>
            <div className="grid grid-cols-3 gap-2">
              <StatRing
                Icon={DumbbellIcon} label="Pass" unit="pass"
                value={thisWeek} goal={weeklyGoal} goalLabel={`${weeklyGoal} pass`}
                color="#22e6c6" iconStroke="stroke-forest-600"
              />
              <StatRing
                Icon={DropletIcon} label="Vatten idag" unit="L"
                value={waterToday} goal={settings.water_goal_ml} goalLabel={`${(settings.water_goal_ml / 1000).toFixed(1)} L`}
                color="#38bdf8" iconStroke="stroke-sky-500"
              />
              <StatRing
                Icon={BarChartIcon} label="Träningstid" unit="min"
                value={Math.round(thisWeekTime / 60)} goal={weeklyGoal * 45} goalLabel={`${weeklyGoal * 45} min`}
                color="#f59e0b" iconStroke="stroke-amber-500"
              />
            </div>
          </div>

          {/* Pass per vecka — stapeldiagram */}
          <div className="bg-white rounded-2xl border border-stone-100 p-4">
            <p className="font-semibold text-stone-800 mb-4">Pass per vecka</p>
            <WeeklyBars weekly={weekly} />
          </div>

          {/* Vatten 7 dagar — linjediagram */}
          <div className="bg-white rounded-2xl border border-stone-100 p-4">
            <div className="flex items-baseline justify-between mb-3">
              <p className="font-semibold text-stone-800">Vatten senaste 7 dagar</p>
              {avgWater > 0 && (
                <span className="text-xs text-stone-400">
                  snitt {(avgWater / 1000).toFixed(1).replace('.', ',')} L/dag
                </span>
              )}
            </div>
            {waterPoints.some((v) => v > 0) ? (
              <>
                <LineChart points={waterPoints} color="#38bdf8" height={72} showDots />
                <div className="flex justify-between mt-1">
                  {last7.map((date, i) => (
                    <span key={date} className={`text-[9px] ${i === 6 ? 'text-sky-600 font-semibold' : 'text-stone-400'}`}>
                      {new Date(date + 'T12:00').toLocaleDateString('sv-SE', { weekday: 'short' })}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 gap-1">
                <DropletIcon className="w-8 h-8 stroke-stone-200" />
                <p className="text-xs text-stone-400">Ingen vattendata loggad ännu</p>
              </div>
            )}
          </div>

          {/* Senaste pass */}
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <p className="font-semibold text-stone-800 px-4 py-3 border-b border-stone-50">Senaste pass</p>
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <DumbbellIcon className="w-10 h-10 stroke-stone-200 mx-auto mb-2" />
                <p className="text-sm text-stone-400">Genomför ditt första pass!</p>
              </div>
            ) : (
              sessions.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-stone-50 last:border-0">
                  <div className="w-9 h-9 rounded-xl bg-forest-50 flex items-center justify-center flex-shrink-0">
                    <DumbbellIcon className="w-4 h-4 stroke-forest-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{s.workout_name}</p>
                    <p className="text-xs text-stone-400">
                      {fmtDate(s.completed_at)}
                      {s.completed_sets > 0 && ` · ${s.completed_sets} set`}
                      {s.duration_seconds > 0 && ` · ${fmt(s.duration_seconds)}`}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-forest-400 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══ TRENDER ═══════════════════════════════════════════════════════════ */}
      {tab === 'trender' && (
        <div className="px-5 space-y-4">

          {/* Vikt */}
          <div className="bg-white rounded-2xl border border-stone-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-stone-800">Viktutveckling</p>
              <button onClick={() => setShowWeightInput((v) => !v)}
                className="flex items-center gap-1 text-xs text-forest-600 font-medium">
                <PlusIcon className="w-3.5 h-3.5 stroke-forest-600" />
                Logga vikt
              </button>
            </div>

            {showWeightInput && (
              <div className="flex gap-2 mb-4">
                <input autoFocus type="number" inputMode="decimal" placeholder="t.ex. 75,5"
                  value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && logWeight()}
                  className="flex-1 bg-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                />
                <span className="flex items-center text-sm text-stone-400">kg</span>
                <button onClick={logWeight} className="px-3 py-2 bg-forest-600 text-white text-sm font-semibold rounded-xl">
                  Spara
                </button>
              </div>
            )}

            {weightEntries.length >= 2 ? (
              <WeightChart entries={weightEntries} />
            ) : weightEntries.length === 1 ? (
              <div className="text-center py-4">
                <p className="text-2xl font-bold text-stone-900">{weightEntries[0]!.weight_kg.toFixed(1).replace('.', ',')} kg</p>
                <p className="text-xs text-stone-400 mt-1">Logga igen imorgon för att se trenden</p>
              </div>
            ) : (
              <p className="text-center text-sm text-stone-400 py-6">Logga din vikt för att se utvecklingen</p>
            )}
          </div>

          {/* Viktlogg */}
          {weightEntries.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <p className="font-semibold text-stone-800 px-4 py-3 border-b border-stone-50">Viktlogg</p>
              {[...weightEntries].reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{e.weight_kg.toFixed(1).replace('.', ',')} kg</p>
                    <p className="text-xs text-stone-400">{fmtDate(e.date)}</p>
                  </div>
                  <button onClick={() => { deleteWeightEntry(e.id); setWeightEntries(getWeightEntries()) }} className="p-1">
                    <XIcon className="w-4 h-4 stroke-stone-300" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* RPE-trend */}
          {rpeEntries.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <p className="font-semibold text-stone-800 mb-3">Belastningsgrad (RPE)</p>
              <LineChart points={rpeEntries.map((e) => e.rpe)} color="#f59e0b" height={64} showDots />
              <div className="flex justify-between mt-1 text-[9px] text-stone-400">
                <span>{fmtDate(rpeEntries[0]!.date)}</span>
                <span>Senast: {rpeEntries[rpeEntries.length-1]!.rpe}/10 · {rpeEntries[rpeEntries.length-1]!.workoutName}</span>
              </div>
              <div className="flex justify-between mt-2 text-[9px] text-stone-300">
                <span>1 = Lätt</span><span>5 = Medel</span><span>10 = Maximalt</span>
              </div>
            </div>
          )}

          {/* Vatten 7 dagar */}
          <div className="bg-white rounded-2xl border border-stone-100 p-4">
            <div className="flex items-baseline justify-between mb-3">
              <p className="font-semibold text-stone-800">Vatten senaste 7 dagar</p>
              {avgWater > 0 && (
                <span className="text-xs text-stone-400">snitt {(avgWater / 1000).toFixed(1).replace('.', ',')} L</span>
              )}
            </div>
            {waterPoints.some((v) => v > 0) ? (
              <>
                {/* Bar chart för vatten */}
                <div className="flex items-end gap-1.5 h-20">
                  {waterPoints.map((ml, i) => {
                    const pct = settings.water_goal_ml > 0 ? Math.min((ml / settings.water_goal_ml) * 100, 100) : 0
                    const isToday = i === 6
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-stone-100 rounded-sm flex items-end" style={{ height: '64px' }}>
                          <div
                            className={`w-full rounded-sm transition-all ${isToday ? 'bg-sky-500' : 'bg-sky-300'}`}
                            style={{ height: `${Math.max(pct, ml > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className={`text-[9px] ${isToday ? 'text-sky-600 font-semibold' : 'text-stone-400'}`}>
                          {new Date(last7[i]! + 'T12:00').toLocaleDateString('sv-SE', { weekday: 'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-stone-300">
                  <span>0 L</span>
                  <span>mål: {(settings.water_goal_ml / 1000).toFixed(1)} L</span>
                </div>

                {/* Vattenring idag */}
                <div className="mt-4 flex items-center gap-4 bg-sky-50 rounded-xl p-3">
                  <Ring value={waterToday} goal={settings.water_goal_ml} color="#38bdf8" size={56} strokeWidth={6} />
                  <div>
                    <p className="text-sm font-bold text-stone-900">
                      {(waterToday / 1000).toFixed(1).replace('.', ',')} L idag
                    </p>
                    <p className="text-xs text-stone-400">
                      av {(settings.water_goal_ml / 1000).toFixed(1)} L · {Math.round((waterToday / settings.water_goal_ml) * 100)}%
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 gap-2">
                <DropletIcon className="w-8 h-8 stroke-stone-200" />
                <p className="text-xs text-stone-400">Logga vatten för att se trenden</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ KALORIER ══════════════════════════════════════════════════════════ */}
      {tab === 'kalorier' && (
        <div className="px-5 space-y-4">
          {nutritionLoading ? (
            <div className="flex justify-center h-32 items-center">
              <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : daySummaries.length === 0 ? (
            <div className="text-center py-16">
              <LeafIcon className="w-12 h-12 stroke-stone-200 mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">Ingen kostdata</h2>
              <p className="text-stone-400 text-sm">Logga dina måltider via Kost-fliken.</p>
            </div>
          ) : (
            <>
              {/* Makro donut */}
              <div className="bg-white rounded-2xl border border-stone-100 p-4">
                <p className="font-semibold text-stone-800 mb-4">Makronutrienter (snitt per dag)</p>
                <MacroDonut protein={avgProtein} carbs={avgCarbs} fat={avgFat} kcal={avgKcal} />
              </div>

              {/* Kalori-linjediagram */}
              <div className="bg-white rounded-2xl border border-stone-100 p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="font-semibold text-stone-800">Kalorier senaste 7 dagar</p>
                  <span className="text-xs text-stone-400">snitt {avgKcal} kcal</span>
                </div>
                <LineChart
                  points={last7.map((date) => daySummaries.find((d) => d.date === date)?.kcal ?? 0)}
                  color="#f59e0b" height={72}
                />
                <div className="flex justify-between mt-1">
                  {last7.map((date, i) => (
                    <span key={date} className={`text-[9px] ${i === 6 ? 'text-amber-600 font-semibold' : 'text-stone-400'}`}>
                      {new Date(date + 'T12:00').toLocaleDateString('sv-SE', { weekday: 'short' })}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stapeldiagram makron */}
              <div className="bg-white rounded-2xl border border-stone-100 p-4">
                <p className="font-semibold text-stone-800 mb-4">Kalorier per dag</p>
                <div className="flex items-end gap-1.5 h-28">
                  {last7.map((date, i) => {
                    const d = daySummaries.find((x) => x.date === date)
                    const kcal = d?.kcal ?? 0
                    const pct = (kcal / maxKcal) * 100
                    const isToday = i === 6
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center gap-1">
                        {kcal > 0 && <span className="text-[8px] text-stone-400">{kcal}</span>}
                        <div className="w-full bg-stone-100 rounded-sm flex items-end" style={{ height: '88px' }}>
                          <div
                            className={`w-full rounded-sm transition-all ${isToday ? 'bg-amber-400' : 'bg-amber-200'}`}
                            style={{ height: `${Math.max(pct, kcal > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className={`text-[9px] ${isToday ? 'text-amber-600 font-semibold' : 'text-stone-400'}`}>
                          {new Date(date + 'T12:00').toLocaleDateString('sv-SE', { weekday: 'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Kaloribalans */}
              {settings.calorie_goal > 0 && (
                <div className="bg-white rounded-2xl border border-stone-100 p-4">
                  <p className="font-semibold text-stone-800 mb-1">Kaloribalans</p>
                  <p className="text-xs text-stone-400 mb-4">Mål: {settings.calorie_goal} kcal/dag · + överskott · – underskott</p>
                  <div className="flex items-center gap-1.5 h-28">
                    {last7.map((date, i) => {
                      const d = daySummaries.find((x) => x.date === date)
                      const balance = d ? d.kcal - settings.calorie_goal : null
                      const isToday = i === 6
                      const maxAbs = Math.max(300, ...last7.map((dt) => {
                        const dd = daySummaries.find((x) => x.date === dt)
                        return dd ? Math.abs(dd.kcal - settings.calorie_goal) : 0
                      }))
                      const pct = balance !== null ? Math.min(Math.abs(balance) / maxAbs * 100, 100) : 0
                      const isPos = (balance ?? 0) >= 0
                      return (
                        <div key={date} className="flex-1 flex flex-col items-center gap-0.5" style={{ height: '112px' }}>
                          {balance !== null && (
                            <span className={`text-[8px] font-medium ${isPos ? 'text-amber-500' : 'text-sky-500'}`}>
                              {isPos ? '+' : ''}{balance}
                            </span>
                          )}
                          <div className="flex-1 flex flex-col justify-center w-full">
                            {balance !== null && isPos && (
                              <div
                                className={`w-full rounded-sm ${isToday ? 'bg-amber-400' : 'bg-amber-200'}`}
                                style={{ height: `${Math.max(pct * 0.5, 4)}%` }}
                              />
                            )}
                            <div className="w-full h-px bg-stone-200" />
                            {balance !== null && !isPos && (
                              <div
                                className={`w-full rounded-sm ${isToday ? 'bg-sky-400' : 'bg-sky-200'}`}
                                style={{ height: `${Math.max(pct * 0.5, 4)}%` }}
                              />
                            )}
                          </div>
                          <span className={`text-[9px] ${isToday ? 'text-amber-600 font-semibold' : 'text-stone-400'}`}>
                            {new Date(date + 'T12:00').toLocaleDateString('sv-SE', { weekday: 'short' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] text-stone-300 mt-1">
                    <span className="text-sky-400">◀ underskott</span>
                    <span className="text-amber-400">överskott ▶</span>
                  </div>
                </div>
              )}

              {/* Daglig lista */}
              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <p className="font-semibold text-stone-800 px-4 py-3 border-b border-stone-50">Daglig uppdelning</p>
                {[...daySummaries].reverse().map((d) => (
                  <div key={d.date} className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-stone-800 capitalize">
                        {new Date(d.date + 'T12:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-stone-400">P {d.protein_g}g · K {d.carbs_g}g · F {d.fat_g}g</p>
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
