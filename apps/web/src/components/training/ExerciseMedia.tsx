import { useState, useSyncExternalStore } from 'react'
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

// ── Delad bildväxlare ─────────────────────────────────────────────────────────
// Övningslistorna kan visa 80 kort samtidigt. Med ett eget setInterval per kort
// blev det ~67 state-uppdateringar/sekund på en telefon; nu driver EN timer alla
// instanser. Timern startar först när någon lyssnar och stoppas när sista
// instansen försvinner (eller när användaren slår på "reducera rörelse").

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function motionQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(REDUCED_MOTION_QUERY)
}

function prefersReducedMotion(): boolean {
  return motionQuery()?.matches ?? false
}

let tickCount = 0
let intervalId: ReturnType<typeof setInterval> | null = null
let motionListenerAttached = false
const tickListeners = new Set<() => void>()

function emitTick() {
  for (const listener of tickListeners) listener()
}

function startTicker() {
  if (intervalId !== null || prefersReducedMotion() || tickListeners.size === 0) return
  intervalId = setInterval(() => {
    tickCount++
    emitTick()
  }, FRAME_MS)
}

function stopTicker() {
  if (intervalId !== null) clearInterval(intervalId)
  intervalId = null
}

/**
 * Följ ändringar i prefers-reduced-motion i stället för att bara läsa av den en
 * gång: slår användaren på inställningen mitt i sessionen ska bilderna stanna
 * direkt (och börja röra sig igen om den slås av).
 */
function attachMotionListener() {
  if (motionListenerAttached) return
  const mql = motionQuery()
  if (!mql) return
  motionListenerAttached = true
  mql.addEventListener('change', () => {
    if (prefersReducedMotion()) {
      stopTicker()
      // Frys på startläget så alla kort visar samma (första) bildruta.
      tickCount = 0
      emitTick()
    } else {
      startTicker()
    }
  })
}

function subscribeTick(listener: () => void): () => void {
  tickListeners.add(listener)
  attachMotionListener()
  startTicker()
  return () => {
    tickListeners.delete(listener)
    if (tickListeners.size === 0) stopTicker()
  }
}

function getTick(): number {
  return tickCount
}

/** Stabil fasgrupp (0 eller 1) härledd ur övningens id. */
function phase(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000
  return h % 2
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
  const tick = useSyncExternalStore(subscribeTick, getTick, () => 0)
  // Fasgrupp per övning, så en hel lista inte växlar helt i takt.
  const frame = (tick + phase(exercise.id)) % 2

  // Fel-flaggorna hör ihop med en *specifik* övning. Utan id:t i state skulle
  // en tidigare övnings misslyckade bilder visa platshållaren en frame innan en
  // nollställande effekt hann köra.
  const [failedFor, setFailedFor] = useState<{ id: string; flags: [boolean, boolean] }>({
    id: exercise.id,
    flags: [false, false],
  })
  const failed: [boolean, boolean] =
    failedFor.id === exercise.id ? failedFor.flags : [false, false]

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
            setFailedFor((prev) => {
              const flags: [boolean, boolean] =
                prev.id === exercise.id ? [prev.flags[0], prev.flags[1]] : [false, false]
              flags[i] = true
              return { id: exercise.id, flags }
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
