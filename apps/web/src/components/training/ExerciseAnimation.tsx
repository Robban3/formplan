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
    const timer = setInterval(() => setFrame((f) => (f + 1) % frames.length), 550)
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
