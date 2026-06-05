import { useState } from 'react'
import { PlayIcon } from '../ui/Icons'
import { ExerciseAnimation } from './ExerciseAnimation'
import {
  exerciseVideoEmbedUrl,
  exerciseVideoSearchUrl,
  getExerciseMedia,
} from '../../lib/exerciseVideos'

interface ExerciseVideoProps {
  exerciseName: string
  /** inline = ovanför set, card = stor demo, row = miniatyr i programlista, compact = liten knapp */
  variant?: 'inline' | 'card' | 'row' | 'compact'
  dark?: boolean
  defaultOpen?: boolean
}

export function ExerciseVideo({
  exerciseName,
  variant = 'card',
  dark = false,
  defaultOpen = false,
}: ExerciseVideoProps) {
  const [videoOpen, setVideoOpen] = useState(defaultOpen)
  const media = getExerciseMedia(exerciseName)

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
        <ExerciseAnimation exerciseName={exerciseName} className="w-full h-full object-cover object-top" />
      </span>
    )
  }

  const sizeClass = variant === 'inline' ? 'aspect-[4/3] max-h-48' : 'aspect-[4/3]'

  return (
    <div className={variant === 'inline' ? 'mb-4' : 'mt-2'}>
      {!videoOpen && (
        <div className={`relative rounded-xl overflow-hidden bg-stone-100 ${sizeClass}`}>
          <ExerciseAnimation
            exerciseName={exerciseName}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
            <p className="text-[10px] text-white/80">Animerad teknikguide</p>
          </div>
        </div>
      )}

      {videoOpen && media && (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            title={`Videotutorial: ${exerciseName}`}
            src={exerciseVideoEmbedUrl(media.youtubeId)}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        {media && (
          <button
            type="button"
            onClick={() => setVideoOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              dark ? 'text-brand-400 hover:text-brand-300' : 'text-forest-600 hover:text-forest-700'
            }`}
          >
            <PlayIcon className="w-3.5 h-3.5" />
            {videoOpen ? 'Visa animation' : 'Videotutorial'}
          </button>
        )}
        {!media && (
          <a
            href={exerciseVideoSearchUrl(exerciseName)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              dark ? 'text-brand-400 hover:text-brand-300' : 'text-forest-600 hover:text-forest-700'
            }`}
          >
            <PlayIcon className="w-3.5 h-3.5" />
            Sök tutorial
          </a>
        )}
      </div>
    </div>
  )
}
