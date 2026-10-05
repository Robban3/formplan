import { useCallback, useEffect, useMemo, useState } from 'react'
import { nutritionApi } from '../../lib/nutritionApi'
import { getLocalWaterSummary, hydrateLocalWaterFromSummary } from '../../lib/waterStore'
import { dateKey, dateKeysInRange, weekRange } from '../../lib/derive'
import { ChevronLeftIcon, ChevronRightIcon, GlassWaterIcon } from '../../components/ui/Icons'
import { useUnits } from '../../hooks/useUnits'
import { useT } from '../../hooks/useT'

const WEEKDAY_SHORT = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

function formatWeekTitle(from: Date, to: Date, isCurrentWeek: boolean, locale: string) {
  if (isCurrentWeek) return 'Denna vecka'
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  return `${fmt(from)} – ${fmt(to)}`
}

function formatDayLabel(dateStr: string, isToday: boolean, locale: string) {
  if (isToday) return 'Idag'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' })
}

interface DayTotal {
  date: string
  total_ml: number
}

interface Props {
  goalMl: number
  refreshKey?: number
}

export function WaterWeekView({ goalMl, refreshKey = 0 }: Props) {
  const { locale, t } = useT()
  const { formatVolume } = useUnits()
  const [weekOffset, setWeekOffset] = useState(0)
  const [days, setDays] = useState<DayTotal[]>([])
  const [loading, setLoading] = useState(true)

  const anchor = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const { from, to } = useMemo(() => weekRange(anchor), [anchor])
  const fromKey = dateKey(from)
  const toKey = dateKey(to)
  const isCurrentWeek = weekOffset === 0
  const today = dateKey()

  const load = useCallback(async () => {
    setLoading(true)
    const keys = dateKeysInRange(from, to)
    try {
      const { days: apiDays } = await nutritionApi.getWaterSummary(fromKey, toKey)
      // Seed the local mirror so day-scoped readers (water challenge) reflect
      // history from other devices; only fills gaps, never double-counts.
      hydrateLocalWaterFromSummary(apiDays)
      const byDate = new Map(apiDays.map((d) => [d.date, d.total_ml]))
      setDays(keys.map((date) => ({ date, total_ml: byDate.get(date) ?? 0 })))
    } catch {
      const { days: localDays } = getLocalWaterSummary(fromKey, toKey)
      const byDate = new Map(localDays.map((d) => [d.date, d.total_ml]))
      setDays(keys.map((date) => ({ date, total_ml: byDate.get(date) ?? 0 })))
    } finally {
      setLoading(false)
    }
  }, [from, to, fromKey, toKey])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const weekTotal = days.reduce((s, d) => s + d.total_ml, 0)
  const weekAvg = Math.round(weekTotal / 7)
  const daysMetGoal = days.filter((d) => d.total_ml >= goalMl).length
  const maxBar = Math.max(goalMl, ...days.map((d) => d.total_ml), 1)

  if (loading) {
    return (
      <div className="flex justify-center pt-12">
        <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-5 py-6 space-y-5">
      {/* Veckonavigering */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-700 transition-colors"
          aria-label="Föregående vecka"
        >
          <ChevronLeftIcon className="w-5 h-5 stroke-stone-500 dark:stroke-stone-400" />
        </button>
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 capitalize">
          {formatWeekTitle(from, to, isCurrentWeek, locale)}
        </span>
        <button
          type="button"
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={isCurrentWeek}
          className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-700 transition-colors disabled:opacity-30"
          aria-label="Nästa vecka"
        >
          <ChevronRightIcon className="w-5 h-5 stroke-stone-500 dark:stroke-stone-400" />
        </button>
      </div>

      {/* Sammanfattning */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Totalt', value: formatVolume(weekTotal) },
          { label: 'Snitt/dag', value: formatVolume(weekAvg) },
          { label: 'Mål uppnått', value: `${daysMetGoal}/7` },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-3 text-center">
            <p className="text-base font-bold text-stone-900 dark:text-stone-100 tabular-nums">{s.value}</p>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Stapeldiagram */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-stone-800 dark:text-stone-200 text-sm">{t('water.intakePerDay')}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">Mål {formatVolume(goalMl)}</p>
        </div>
        <div className="relative flex items-end justify-between gap-1.5 h-36">
          {/* Mållinje */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-sky-300 pointer-events-none z-10"
            style={{ bottom: `${(goalMl / maxBar) * 100}%` }}
          />
          {days.map((day, i) => {
            const pct = day.total_ml / maxBar
            const metGoal = day.total_ml >= goalMl
            const isToday = day.date === today
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                <div className="w-full flex items-end h-full">
                  <div
                    className={`w-full rounded-lg transition-all min-h-[4px] ${
                      metGoal ? 'bg-forest-500' : 'bg-sky-400'
                    } ${isToday ? 'ring-2 ring-forest-600 ring-offset-1' : ''}`}
                    style={{ height: `${Math.max(pct * 100, day.total_ml > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className={`text-[10px] font-medium ${isToday ? 'text-forest-800 dark:text-forest-400' : 'text-stone-500 dark:text-stone-400'}`}>
                  {WEEKDAY_SHORT[i]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daglista */}
      <div>
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">{t('water.dayByDay')}</p>
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          {[...days].reverse().map((day, i, arr) => {
            const pct = goalMl > 0 ? Math.min((day.total_ml / goalMl) * 100, 100) : 0
            const isToday = day.date === today
            return (
              <div
                key={day.date}
                className={`flex items-center gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-stone-50' : ''}`}
              >
                <GlassWaterIcon className={`w-5 h-5 shrink-0 ${isToday ? 'stroke-forest-600' : 'stroke-sky-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium capitalize ${isToday ? 'text-forest-800 dark:text-forest-300' : 'text-stone-800 dark:text-stone-200'}`}>
                    {formatDayLabel(day.date, isToday, locale)}
                  </p>
                  <div className="mt-1.5 h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 100 ? 'bg-forest-500' : 'bg-sky-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                    {day.total_ml > 0 ? formatVolume(day.total_ml) : '—'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                    {day.total_ml > 0 ? `${Math.round(pct)}%` : '0%'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
