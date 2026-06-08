import { ExerciseAnimation } from './ExerciseAnimation'

interface ExerciseVideoProps {
  exerciseName: string
  /** inline = ovanför set, card = stor demo, row = miniatyr i programlista, compact = liten knapp */
  variant?: 'inline' | 'card' | 'row' | 'compact'
}

export function ExerciseVideo({ exerciseName, variant = 'card' }: ExerciseVideoProps) {
  if (variant === 'row') {
    return (
      <span className="relative block w-14 h-10 rounded-lg overflow-hidden bg-stone-100 shrink-0">
        <ExerciseAnimation
          exerciseName={exerciseName}
          className="w-full h-full object-cover object-top"
        />
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <span className="relative block w-10 h-10 rounded-lg overflow-hidden bg-stone-100 shrink-0">
        <ExerciseAnimation
          exerciseName={exerciseName}
          className="w-full h-full object-cover object-top"
        />
      </span>
    )
  }

  const aspectClass = variant === 'inline' ? 'aspect-[4/3] max-h-48' : 'aspect-[4/3]'

  return (
    <div className={variant === 'inline' ? 'mb-4' : 'mt-2'}>
      <div className={`relative rounded-xl overflow-hidden bg-stone-100 ${aspectClass}`}>
        <ExerciseAnimation
          exerciseName={exerciseName}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-2">
          <p className="text-[10px] text-white/80 font-medium">Rörelseguide</p>
        </div>
      </div>
    </div>
  )
}
