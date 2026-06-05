import { ChevronLeftIcon } from '../ui/Icons'

interface Props {
  title: string
  subtitle?: string
  size?: 'sm' | 'lg'
  back?: { label: string; onClick: () => void }
  badge?: React.ReactNode
}

export function WorkoutHero({ title, subtitle, size = 'lg', back, badge }: Props) {
  const tall = size === 'lg'

  return (
    <div className={`relative overflow-hidden ${tall ? 'h-64' : 'h-48'}`}>
      <img
        src="/training-hero.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[50%_15%]"
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 40%, transparent 75%)',
        }}
      />

      {badge && <div className="absolute top-3 right-3 z-10">{badge}</div>}

      <div className={`absolute left-5 right-5 z-10 ${tall ? 'bottom-5' : 'bottom-4'}`}>
        {back && (
          <button
            onClick={back.onClick}
            className="flex items-center gap-1 text-white/80 text-sm mb-3"
          >
            <ChevronLeftIcon className="w-4 h-4 stroke-white/80" />
            {back.label}
          </button>
        )}
        <h2 className={`font-bold text-white drop-shadow-sm ${tall ? 'text-2xl' : 'text-lg'}`}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-white/80 text-sm mt-0.5 drop-shadow-sm">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
