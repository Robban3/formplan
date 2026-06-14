import type { FoodLogEntry, MealSlot } from '../../lib/nutritionApi'
import { PlusIcon } from '../ui/Icons'
import { MealRecipeGenerator } from './MealRecipeGenerator'

const SLOT_LABELS: Record<MealSlot, string> = {
  frukost: 'Frukost',
  lunch: 'Lunch',
  middag: 'Middag',
  mellanmar: 'Mellanmål',
}

const SLOT_COLORS: Record<MealSlot, string> = {
  frukost: 'bg-amber-100 text-amber-700',
  lunch: 'bg-forest-100 text-forest-700',
  middag: 'bg-sky-100 text-sky-700',
  mellanmar: 'bg-purple-100 text-purple-700',
}

function FoodAvatar({ name, slot }: { name: string; slot: MealSlot }) {
  const initial = name.trim()[0]?.toUpperCase() ?? '?'
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${SLOT_COLORS[slot]}`}>
      {initial}
    </div>
  )
}

interface Props {
  slot: MealSlot
  entries: FoodLogEntry[]
  date: string
  onAdd: (slot: MealSlot) => void
  onTapEntry: (entry: FoodLogEntry) => void
  onLogged?: () => void
}

export function MealSection({ slot, entries, date, onAdd, onTapEntry, onLogged }: Props) {
  const totalKcal = entries.reduce((s, e) => s + e.kcal, 0)

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
        <span className="font-semibold text-stone-800">{SLOT_LABELS[slot]}</span>
        {totalKcal > 0 && (
          <span className="text-sm font-medium text-stone-500">{totalKcal} kcal</span>
        )}
      </div>

      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onTapEntry(entry)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-stone-50 hover:bg-stone-50 active:bg-stone-100 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FoodAvatar name={entry.food_name} slot={slot} />
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{entry.food_name}</p>
              <p className="text-xs text-stone-400">{entry.amount_g} g</p>
            </div>
          </div>
          <span className="text-sm font-medium text-stone-500 flex-shrink-0 ml-2">{entry.kcal} kcal</span>
        </button>
      ))}

      <button
        onClick={() => onAdd(slot)}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm text-forest-600 font-medium hover:bg-forest-50 transition-colors"
      >
        <PlusIcon className="w-4 h-4 stroke-forest-600" />
        Lägg till mat
      </button>

      <MealRecipeGenerator slot={slot} date={date} onLogged={onLogged} />
    </div>
  )
}
