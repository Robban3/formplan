import type { FoodLogEntry, MealSlot } from '../../lib/nutritionApi'
import { PlusIcon } from '../ui/Icons'

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

function foodEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('kyckling') || n.includes('chicken')) return '🍗'
  if (n.includes('ägg') || n.includes('egg')) return '🥚'
  if (n.includes('havre') || n.includes('gröt') || n.includes('oat')) return '🥣'
  if (n.includes('yoghurt') || n.includes('kvarg')) return '🥛'
  if (n.includes('banan')) return '🍌'
  if (n.includes('ris') || n.includes('rice')) return '🍚'
  if (n.includes('avokado') || n.includes('avocado')) return '🥑'
  if (n.includes('sallad') || n.includes('salad')) return '🥗'
  if (n.includes('nöt') || n.includes('nut')) return '🥜'
  return '🍽️'
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${SLOT_COLORS[slot]}`}>
              {foodEmoji(entry.food_name)}
            </div>
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
    </div>
  )
}
