interface Props {
  eaten: number
  goal: number
  size?: number
}

// Donut ring showing calorie progress — matches the design's circular chart
export function MacroRing({ eaten, goal, size = 120 }: Props) {
  const r = (size / 2) * 0.72
  const circ = 2 * Math.PI * r
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0
  const cx = size / 2
  const cy = size / 2

  // Color: green if on track, amber if over
  const stroke = pct > 1.05 ? '#f59e0b' : '#1e6e42'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e7e5e4" strokeWidth={size * 0.09} />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={size * 0.09}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-stone-900" style={{ fontSize: size * 0.19 }}>
          {eaten.toLocaleString('sv-SE')}
        </span>
        <span className="text-stone-400" style={{ fontSize: size * 0.1 }}>
          / {goal.toLocaleString('sv-SE')} kcal
        </span>
      </div>
    </div>
  )
}
