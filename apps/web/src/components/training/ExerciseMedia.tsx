import { useEffect, useRef, useState } from 'react'
import type { CatalogExercise } from '../../lib/exerciseCatalog'
import { DumbbellIcon } from '../ui/Icons'

/**
 * Visar en katalogövnings två bildrutor (startläge → slutläge) och växlar mellan
 * dem så rörelsen syns. Komponenten tar emot en *upplöst* katalogövning — den
 * gissar aldrig fram en bild ur ett fritextnamn, så fel bild kan inte visas.
 *
 * Går en bild inte att ladda faller vi tillbaka på övningens andra bildruta och
 * därefter på en neutral platshållare — aldrig på en annan övnings bild.
 */

const FRAME_MS = 1200

export interface ExerciseMediaProps {
  exercise: CatalogExercise
  variant?: 'thumb' | 'card'
  /** Visa namnet i kortvarianten (standard: ja). */
  showName?: boolean
  className?: string
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Stabil fasförskjutning (0–FRAME_MS) härledd ur övningens id. */
function phaseOffset(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000
  return h % FRAME_MS
}

/** Neutral platshållare — används när ingen bild kan visas. */
export function ExercisePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-stone-100 text-stone-300 ${className}`}
      aria-hidden="true"
    >
      <DumbbellIcon className="w-5 h-5 stroke-stone-300" />
    </div>
  )
}

export function ExerciseMedia({
  exercise,
  variant = 'thumb',
  showName = true,
  className = '',
}: ExerciseMediaProps) {
  const [frame, setFrame] = useState(0)
  const [failed, setFailed] = useState<[boolean, boolean]>([false, false])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Nollställ när övningen byts (samma komponent återanvänds i listor).
  useEffect(() => {
    setFrame(0)
    setFailed([false, false])
  }, [exercise.id])

  useEffect(() => {
    if (prefersReducedMotion()) return
    const tick = () => setFrame((f) => (f === 0 ? 1 : 0))
    // Fasförskjutning per övning, så en hel lista inte blinkar i takt.
    startRef.current = setTimeout(() => {
      tick()
      timerRef.current = setInterval(tick, FRAME_MS)
    }, phaseOffset(exercise.id))
    return () => {
      if (startRef.current) clearTimeout(startRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      startRef.current = null
      timerRef.current = null
    }
  }, [exercise.id])

  const bothFailed = failed[0] && failed[1]
  // Om den aktuella rutan saknas visar vi övningens andra ruta i stället.
  const shown = failed[frame] ? (frame === 0 ? 1 : 0) : frame

  const box =
    variant === 'thumb'
      ? 'w-14 h-10 rounded-lg'
      : 'w-full aspect-[4/3] rounded-2xl'

  if (bothFailed) {
    return <ExercisePlaceholder className={`${box} ${className}`} />
  }

  return (
    <div
      className={`relative overflow-hidden bg-stone-100 flex-shrink-0 ${box} ${className}`}
    >
      {exercise.images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === shown ? exercise.name : ''}
          aria-hidden={i === shown ? undefined : true}
          loading="lazy"
          decoding="async"
          onError={() =>
            setFailed((prev) => {
              const next: [boolean, boolean] = [prev[0], prev[1]]
              next[i] = true
              return next
            })
          }
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            i === shown ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {variant === 'card' && showName && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pt-6 pb-2">
          <p className="text-white text-sm font-semibold drop-shadow-sm">{exercise.name}</p>
        </div>
      )}

      {variant === 'card' && (
        <div className="absolute top-2 right-2 flex gap-1" aria-hidden="true">
          {[0, 1].map((i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === shown ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
