import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { nutritionApi, type WaterEntry } from '../../lib/nutritionApi'
import { getLocalWater, addLocalWater } from '../../lib/waterStore'
import { dateKey } from '../../lib/derive'
import { toast } from '../../lib/toast'
import { toastIfNotNetwork } from '../../lib/errors'
import { CheckIcon, ChevronLeftIcon, DropletIcon, GlassWaterIcon } from '../../components/ui/Icons'
import { useSettings } from '../../hooks/useSettings'
import { WaterWeekView } from './WaterWeekView'

const QUICK_OPTIONS = [125, 250, 500, 750, 1000]
const DEFAULT_ML = 250

function formatTime(iso?: string) {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function formatVolume(ml: number) {
  return `${ml.toLocaleString('sv-SE')} ml`
}

function normalizeEntry(entry: WaterEntry, amount_ml: number): WaterEntry {
  return {
    ...entry,
    amount_ml: entry.amount_ml ?? amount_ml,
    logged_at: entry.logged_at ?? new Date().toISOString(),
  }
}

type WaterTab = 'idag' | 'vecka'

const GOAL_HIT_KEY = (date: string) => `formplan_water_goal_hit_${date}`

function formatLiters(ml: number) {
  return `${(ml / 1000).toFixed(1).replace('.', ',')} L`
}

function celebrateWaterGoal(totalMl: number, goalMl: number) {
  toast.success(
    `Mål uppnått! Du har druckit ${formatLiters(totalMl)} av ${formatLiters(goalMl)} idag.`,
    6000
  )
  navigator.vibrate?.([100, 50, 100])
}

export function WaterPage() {
  const navigate = useNavigate()
  const { water_goal_ml: GOAL_ML } = useSettings()
  const today = dateKey()
  const [entries, setEntries] = useState<WaterEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [tab, setTab] = useState<WaterTab>('idag')
  const [selectedMl, setSelectedMl] = useState(DEFAULT_ML)
  const [useLocal, setUseLocal] = useState(false)
  const [weekRefresh, setWeekRefresh] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { entries, total_ml } = await nutritionApi.getWater(today)
      setEntries(entries.map((e) => normalizeEntry(e, e.amount_ml)))
      setTotal(total_ml)
      setUseLocal(false)
    } catch {
      const local = getLocalWater(today)
      setEntries(local.entries)
      setTotal(local.total_ml)
      setUseLocal(true)
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd() {
    if (adding) return
    setAdding(true)

    const apply = (raw: WaterEntry) => {
      const entry = normalizeEntry(raw, selectedMl)
      const hitKey = GOAL_HIT_KEY(today)
      const prevTotal = total
      const nextTotal = prevTotal + entry.amount_ml
      const crossedGoal = prevTotal < GOAL_ML && nextTotal >= GOAL_ML

      setEntries((prev) => [...prev, entry])
      setTotal(nextTotal)
      setWeekRefresh((n) => n + 1)

      if (crossedGoal && localStorage.getItem(hitKey) !== '1') {
        localStorage.setItem(hitKey, '1')
        celebrateWaterGoal(nextTotal, GOAL_ML)
      } else {
        toast.success(`+${entry.amount_ml} ml tillagt`)
      }
    }

    try {
      if (useLocal) {
        apply(addLocalWater(today, selectedMl))
        return
      }
      const { entry } = await nutritionApi.addWater(today, selectedMl)
      apply(entry)
    } catch (e) {
      try {
        setUseLocal(true)
        apply(addLocalWater(today, selectedMl))
      } catch {
        toastIfNotNetwork(e, toast.error)
      }
    } finally {
      setAdding(false)
    }
  }

  const goalReached = total >= GOAL_ML
  const pct = Math.min(total / GOAL_ML, 1)
  const r = 72
  const circ = 2 * Math.PI * r
  const cx = 88
  const cy = 88

  return (
    <div className="flex flex-col min-h-full bg-white pb-24">
      <div className="flex items-center gap-3 px-4 pt-12 pb-3">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
          <ChevronLeftIcon className="w-5 h-5 stroke-stone-600" />
        </button>
        <h1 className="text-xl font-bold text-stone-900 flex-1">Vatten</h1>
      </div>

      <div className="px-4 flex gap-5 border-b border-stone-100">
        {(['idag', 'vecka'] as WaterTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'text-forest-600 border-b-2 border-forest-600' : 'text-stone-400'
            }`}
          >
            {t === 'idag' ? 'Idag' : 'Vecka'}
          </button>
        ))}
      </div>

      {tab === 'vecka' ? (
        <WaterWeekView goalMl={GOAL_ML} refreshKey={weekRefresh} />
      ) : loading ? (
        <div className="flex justify-center pt-12">
          <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-5 py-6 space-y-6">
          {/* Progressring */}
          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: cx * 2, height: cy * 2 }}>
              <svg width={cx * 2} height={cy * 2}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e7e5e4" strokeWidth={14} />
                <circle
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={goalReached ? '#16a34a' : '#0ea5e9'}
                  strokeWidth={14}
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - pct)}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <DropletIcon className={`w-6 h-6 mb-1 ${goalReached ? 'stroke-forest-600' : 'stroke-sky-500'}`} />
                <span className="text-2xl font-bold text-stone-900">
                  {formatLiters(total)}
                </span>
                <span className="text-sm text-stone-400">av {GOAL_ML / 1000} L</span>
                <span className={`text-sm font-semibold mt-0.5 ${goalReached ? 'text-forest-600' : 'text-sky-500'}`}>
                  ({Math.round(pct * 100)}%)
                </span>
              </div>
            </div>
          </div>

          {goalReached && (
            <div className="flex items-center gap-3 bg-forest-50 border border-forest-200 rounded-2xl px-4 py-3.5">
              <div className="w-10 h-10 rounded-full bg-forest-600 flex items-center justify-center shrink-0">
                <CheckIcon className="w-5 h-5 stroke-white" />
              </div>
              <div>
                <p className="font-semibold text-forest-800">Dagsmål uppnått!</p>
                <p className="text-sm text-forest-600">
                  Du har druckit {formatLiters(total)} idag — bra jobbat.
                </p>
              </div>
            </div>
          )}

          {/* Lägg till — direkt under ringen */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="w-full bg-forest-600 hover:bg-forest-700 active:bg-forest-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {adding ? 'Lägger till…' : `Lägg till ${selectedMl} ml`}
          </button>

          {/* Snabbval */}
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2">Snabbval</p>
            <div className="flex gap-2">
              {QUICK_OPTIONS.map((ml) => (
                <button
                  key={ml}
                  type="button"
                  onClick={() => setSelectedMl(ml)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-colors ${
                    selectedMl === ml
                      ? 'bg-forest-50 ring-2 ring-forest-600'
                      : 'bg-stone-50 hover:bg-stone-100 active:bg-stone-200'
                  }`}
                >
                  <GlassWaterIcon className={`w-5 h-5 ${selectedMl === ml ? 'stroke-forest-600' : 'stroke-sky-400'}`} />
                  <span className={`text-xs font-medium ${selectedMl === ml ? 'text-forest-700' : 'text-stone-500'}`}>
                    {ml < 1000 ? `${ml} ml` : `${ml / 1000} L`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Logg — volym vänster, tid höger */}
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2">Logg</p>
            {entries.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">Inget loggat ännu idag</p>
            ) : (
              <div className="space-y-0">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 py-3 border-b border-stone-50 last:border-0"
                  >
                    <GlassWaterIcon className="w-5 h-5 stroke-sky-400 shrink-0" />
                    <span className="text-sm font-medium text-stone-800 tabular-nums">
                      {formatVolume(entry.amount_ml)}
                    </span>
                    <span className="flex-1" />
                    <span className="text-sm text-stone-400 tabular-nums">
                      {formatTime(entry.logged_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
