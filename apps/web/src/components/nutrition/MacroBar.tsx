interface Props {
  label: string
  eaten: number
  goal: number
  unit?: string
  color: string // tailwind bg class
}

export function MacroBar({ label, eaten, goal, unit = 'g', color }: Props) {
  const pct = goal > 0 ? Math.min((eaten / goal) * 100, 100) : 0

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        <span className="text-xs text-stone-400">
          {eaten} / {goal} {unit}
        </span>
      </div>
      <div className="w-full bg-stone-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
