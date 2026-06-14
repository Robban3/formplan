import { useEffect, useState } from 'react'
import { getExerciseFrameUrls } from '../../lib/exerciseVideos'

interface ExerciseAnimationProps {
  exerciseName: string
  className?: string
  alt?: string
}

/** Växlar mellan två bildrutor — ger en enkel rörelseanimation per övning. */
export function ExerciseAnimation({ exerciseName, className = '', alt }: ExerciseAnimationProps) {
  const frames = getExerciseFrameUrls(exerciseName)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    // Lugnare växling mellan bildrutorna (~1,3 s) så rörelsen inte flimrar.
    const timer = setInterval(() => setFrame((f) => (f + 1) % frames.length), 1300)
    return () => clearInterval(timer)
  }, [frames.length])

  return (
    <img
      src={frames[frame]}
      alt={alt ?? `Teknik: ${exerciseName}`}
      className={className}
      loading="lazy"
    />
  )
}
