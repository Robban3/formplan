import type { CatalogExercise } from '../../lib/exerciseCatalog'
import { ExerciseMedia } from './ExerciseMedia'
import { MuscleMap } from './MuscleMap'

/** Svenska etiketter för katalogens engelska utrustningsnycklar. */
const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Skivstång',
  dumbbell: 'Hantlar',
  'body only': 'Kroppsvikt',
  machine: 'Maskin',
  cable: 'Kabel',
  kettlebells: 'Kettlebell',
  'e-z curl bar': 'EZ-stång',
  bands: 'Gummiband',
  'medicine ball': 'Medicinboll',
  'exercise ball': 'Pilatesboll',
  'foam roll': 'Foamroller',
  other: 'Övrigt',
}

export function equipmentLabel(equipment: string): string {
  return EQUIPMENT_LABELS[equipment] ?? equipment
}

export interface ExerciseDetailProps {
  exercise: CatalogExercise
  className?: string
}

/**
 * Fullständig vy av en katalogövning: bildsekvens, namn, kategori/utrustning
 * och muskelkarta. Används överallt där en övning visas i detalj.
 */
export function ExerciseDetail({ exercise, className = '' }: ExerciseDetailProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <ExerciseMedia key={exercise.id} exercise={exercise} variant="card" showName={false} />

      <div>
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">{exercise.name}</h3>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span className="text-[11px] font-medium text-forest-800 dark:text-forest-300 bg-forest-50 dark:bg-forest-900/30 border border-forest-100 dark:border-forest-800 rounded-full px-2 py-0.5">
            {exercise.category}
          </span>
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-700 rounded-full px-2 py-0.5">
            {equipmentLabel(exercise.equipment)}
          </span>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">
          Muskler som tränas
        </p>
        <MuscleMap
          primary={exercise.primaryMuscles}
          secondary={exercise.secondaryMuscles}
          className="max-w-[240px]"
        />
      </div>
    </div>
  )
}
