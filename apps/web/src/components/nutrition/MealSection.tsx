import type { FoodLogEntry, MealSlot } from '../../lib/nutritionApi'
import { PlusIcon } from '../ui/Icons'

const SLOT_LABELS: Record<MealSlot, string> = {
  frukost: 'Frukost',
  lunch: 'Lunch',
  middag: 'Middag',
  mellanmar: 'Mellanmål',
}

interface Props {
  slot: MealSlot
  entries: FoodLogEntry[]
  onAdd: (slot: MealSlot) => void
  onTapEntry: (entry: FoodLogEntry) => void
}

export function MealSection({ slot, entries, onAdd, onTapEntry }: Props) {
  const totalKcal = entries.reduce((s, e) => s + e.kcal, 0)

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
        <span className="font-semibold text-stone-800">{SLOT_LABELS[slot]}</span>
        {totalKcal > 0 && (
          <span className="text-stone-400 text-sm">{totalKcal} kcal</span>
        )}
      </div>

      {/* Entries */}
      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onTapEntry(entry)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50 active:bg-stone-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-sm">
              🍽️
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-stone-800">{entry.food_name}</p>
              <p className="text-xs text-stone-400">{entry.amount_g} g</p>
            </div>
          </div>
          <span className="text-sm text-stone-500 flex-shrink-0">&rsaquo;</span>
        </button>
      ))}

      {/* Add button */}
      <button
        onClick={() => onAdd(slot)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-forest-600 font-medium hover:bg-forest-50 transition-colors"
      >
        <PlusIcon className="w-4 h-4 stroke-forest-600" />
        Lägg till mat
      </button>
    </div>
  )
}
