import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, PlusIcon, XIcon, RulerIcon } from '../components/ui/Icons'
import {
  getMeasurements,
  addMeasurement,
  deleteMeasurement,
  type BodyMeasurement,
} from '../lib/measurementStore'

const FIELDS: { key: keyof BodyMeasurement; label: string; unit: string; placeholder: string }[] = [
  { key: 'weight_kg', label: 'Vikt',    unit: 'kg', placeholder: '75,0' },
  { key: 'waist_cm',  label: 'Midja',   unit: 'cm', placeholder: '80' },
  { key: 'chest_cm',  label: 'Bröst',   unit: 'cm', placeholder: '100' },
  { key: 'hips_cm',   label: 'Höfter',  unit: 'cm', placeholder: '95' },
  { key: 'arm_cm',    label: 'Arm',     unit: 'cm', placeholder: '35' },
  { key: 'thigh_cm',  label: 'Lår',     unit: 'cm', placeholder: '55' },
]

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('sv-SE', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function MiniLineChart({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const W = 80; const H = 28; const pad = 4
  const min = Math.min(...values); const max = Math.max(...values)
  const range = max - min || 1
  const fx = (i: number) => pad + (i / (values.length - 1)) * (W - pad * 2)
  const fy = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2)
  const pts = values.map((v, i) => `${fx(i)},${fy(v)}`).join(' ')
  const change = values[values.length - 1]! - values[0]!
  const sign = change > 0 ? '+' : ''
  return (
    <div className="flex items-center gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
        {values.map((v, i) => <circle key={i} cx={fx(i)} cy={fy(v)} r="2" fill={color} />)}
      </svg>
      <span className="text-[10px] font-semibold" style={{ color }}>
        {sign}{change.toFixed(1)}
      </span>
    </div>
  )
}

export function MeasurementsPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<BodyMeasurement[]>(getMeasurements)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  function reload() { setEntries(getMeasurements()) }

  function handleSave() {
    const m: Omit<BodyMeasurement, 'id'> = {
      date: new Date().toISOString().slice(0, 10),
    }
    for (const f of FIELDS) {
      const v = parseFloat((form[f.key] ?? '').replace(',', '.'))
      if (!isNaN(v) && v > 0) (m as Record<string, unknown>)[f.key] = v
    }
    if (Object.keys(m).length <= 1) return // only date, no values
    addMeasurement(m)
    reload()
    setAdding(false)
    setForm({})
  }

  // Build per-field series for trend charts
  const fieldSeries: Record<string, number[]> = {}
  for (const f of FIELDS) {
    fieldSeries[f.key] = entries
      .map((e) => (e as unknown as Record<string, unknown>)[f.key] as number | undefined)
      .filter((v): v is number => v !== undefined)
  }

  const latest = entries[entries.length - 1]

  return (
    <div className="pb-10">
      <div className="px-5 pt-header pb-4 bg-white border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-stone-400 text-sm mb-3">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
          Mer
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Kroppsmätningar</h1>
            <p className="text-sm text-stone-400 mt-0.5">Följ din kroppssammansättning</p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center"
          >
            <PlusIcon className="w-5 h-5 stroke-white" />
          </button>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {/* Add form */}
        {adding && (
          <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-stone-800">Ny mätning</p>
              <button onClick={() => { setAdding(false); setForm({}) }}>
                <XIcon className="w-4 h-4 stroke-stone-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key} className="min-w-0">
                  <label className="text-xs text-stone-500 font-medium">{f.label}</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number" inputMode="decimal"
                      placeholder={f.placeholder}
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="flex-1 min-w-0 bg-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                    />
                    <span className="text-xs text-stone-400 w-6">{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 bg-forest-700 text-white text-sm font-semibold rounded-xl"
            >
              Spara mätning
            </button>
          </div>
        )}

        {/* Trend cards */}
        {entries.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => {
              const vals = fieldSeries[f.key] ?? []
              const latestVal = (latest as unknown as Record<string, unknown>)?.[f.key] as number | undefined
              if (vals.length === 0) return null
              const color = f.key === 'weight_kg' ? '#22e6c6' : '#6366f1'
              return (
                <div key={f.key} className="bg-white rounded-2xl border border-stone-100 p-3">
                  <p className="text-xs text-stone-400 font-medium">{f.label}</p>
                  {latestVal && (
                    <p className="text-lg font-bold text-stone-900 mt-0.5">
                      {latestVal.toFixed(1).replace('.', ',')} {f.unit}
                    </p>
                  )}
                  <div className="mt-2">
                    <MiniLineChart values={vals} color={color} />
                  </div>
                </div>
              )
            }).filter(Boolean)}
          </div>
        )}

        {/* History list */}
        {entries.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <p className="font-semibold text-stone-800 px-4 py-3 border-b border-stone-50">Historik</p>
            {[...entries].reverse().map((e) => (
              <div key={e.id} className="px-4 py-3 border-b border-stone-50 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-stone-800">{fmtDate(e.date)}</p>
                  <button onClick={() => { deleteMeasurement(e.id); reload() }}>
                    <XIcon className="w-4 h-4 stroke-stone-300" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {FIELDS.map((f) => {
                    const val = (e as unknown as Record<string, unknown>)[f.key] as number | undefined
                    if (!val) return null
                    return (
                      <span key={f.key} className="text-xs text-stone-500">
                        <span className="font-medium text-stone-700">{f.label}:</span>{' '}
                        {val.toFixed(1).replace('.', ',')} {f.unit}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {entries.length === 0 && !adding && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
              <RulerIcon className="w-7 h-7 stroke-stone-400" />
            </div>
            <p className="font-semibold text-stone-800">Inga mätningar ännu</p>
            <p className="text-sm text-stone-400 mt-1">Tryck på + för att logga din första mätning</p>
          </div>
        )}
      </div>
    </div>
  )
}
