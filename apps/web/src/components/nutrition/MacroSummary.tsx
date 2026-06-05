import type { DailyGoals } from '../../lib/nutritionApi'

interface Eaten {
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

interface Props {
  eaten: Eaten
  goals: DailyGoals
  size?: number
}

function StatLine({ label, eaten, goal, unit }: { label: string; eaten: number; goal: number; unit: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm text-stone-600">{label}</span>
      <span className="text-sm font-semibold text-stone-900 tabular-nums">
        {Math.round(eaten).toLocaleString('sv-SE')}
        <span className="text-stone-400 font-normal"> / {goal.toLocaleString('sv-SE')} {unit}</span>
      </span>
    </div>
  )
}

export function MacroSummary({ eaten, goals, size = 110 }: Props) {
  const macroKcal = {
    protein: eaten.protein_g * 4,
    fat: eaten.fat_g * 9,
    carbs: eaten.carbs_g * 4,
  }
  const macroTotal = macroKcal.protein + macroKcal.fat + macroKcal.carbs || 1
  const kcalLeft = Math.max(0, goals.kcal - eaten.kcal)

  const r = size * 0.36
  const circ = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2
  const strokeW = size * 0.11

  const segments = [
    { pct: macroKcal.protein / macroTotal, color: '#22c55e' },
    { pct: macroKcal.fat / macroTotal, color: '#fbbf24' },
    { pct: macroKcal.carbs / macroTotal, color: '#86efac' },
  ]

  let offset = 0

  return (
    <div>
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e7e5e4" strokeWidth={strokeW} />
            {segments.map((seg, i) => {
              const dash = seg.pct * circ
              const el = (
                <circle
                  key={i}
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeW}
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ strokeDashoffset: circ * 0.25 - offset * circ }}
                />
              )
              offset += seg.pct
              return el
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold text-stone-900 text-lg leading-none">
              {Math.round(eaten.kcal).toLocaleString('sv-SE')}
            </span>
            <span className="text-[10px] text-stone-400 mt-0.5">
              / {goals.kcal.toLocaleString('sv-SE')}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <StatLine label="Kalorier" eaten={eaten.kcal} goal={goals.kcal} unit="kcal" />
          <StatLine label="Protein" eaten={eaten.protein_g} goal={goals.protein_g} unit="g" />
          <StatLine label="Fett" eaten={eaten.fat_g} goal={goals.fat_g} unit="g" />
          <StatLine label="Kolhydrater" eaten={eaten.carbs_g} goal={goals.carbs_g} unit="g" />
        </div>
      </div>

      {kcalLeft > 0 && (
        <p className="text-xs text-stone-400 text-center mt-3">
          Du har {Math.round(kcalLeft)} kcal kvar att äta idag.
        </p>
      )}
    </div>
  )
}
