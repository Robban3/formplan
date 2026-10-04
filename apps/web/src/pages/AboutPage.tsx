import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  DumbbellIcon,
  LeafIcon,
  BotIcon,
  TargetIcon,
  BarChartIcon,
  TrophyIcon,
  HeartIcon,
} from '../components/ui/Icons'
import { useT } from '../hooks/useT'
import { aboutContent } from '../lib/content/about'

/** Bara det visuella — texten kommer ur lib/content/about.ts. */
const FEATURE_VISUALS = [
  { Icon: DumbbellIcon, bg: 'bg-forest-50 dark:bg-forest-900/30', stroke: 'stroke-forest-600' },
  { Icon: LeafIcon, bg: 'bg-sky-50 dark:bg-sky-900/30', stroke: 'stroke-sky-600' },
  { Icon: TargetIcon, bg: 'bg-purple-50', stroke: 'stroke-purple-600' },
  { Icon: BarChartIcon, bg: 'bg-amber-50 dark:bg-amber-900/25', stroke: 'stroke-amber-600' },
  { Icon: TrophyIcon, bg: 'bg-orange-50', stroke: 'stroke-orange-500' },
  { Icon: BotIcon, bg: 'bg-rose-50', stroke: 'stroke-rose-500' },
]

export function AboutPage() {
  const { t, lang } = useT()
  const about = aboutContent(lang)
  const navigate = useNavigate()
  return (
    <div className="pb-10">
      <div className="px-5 pt-header pb-4">
        <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mb-4">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-500 dark:stroke-stone-400" />
          Mer
        </button>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">{t('page.aboutApp')}</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Version 0.1.0</p>
      </div>

      {/* Hero */}
      <div className="mx-5 bg-forest-700 rounded-2xl p-6 text-white mb-5">
        <div className="w-12 h-12 bg-white dark:bg-stone-800/15 rounded-2xl flex items-center justify-center mb-4">
          <DumbbellIcon className="w-6 h-6 stroke-white" />
        </div>
        <h2 className="text-xl font-bold mb-2">{about.heroTitle}</h2>
        <p className="text-sm text-forest-100 leading-relaxed">
          {about.heroBody}
        </p>
      </div>

      {/* Mission */}
      <div className="mx-5 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <HeartIcon className="w-4 h-4 stroke-rose-400" />
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">{about.missionTitle}</p>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
          {about.missionBody}
        </p>
      </div>

      {/* Feature list */}
      <div className="px-5 space-y-3 mb-6">
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Funktioner</p>
        {FEATURE_VISUALS.map(({ Icon, bg, stroke }, i) => (
          <div key={i} className="flex items-start gap-3 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${stroke}`} />
            </div>
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm">{about.features[i]?.title}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{about.features[i]?.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 text-center space-y-1">
        <p className="text-xs text-stone-500 dark:text-stone-400">{about.madeIn}</p>
        <p className="text-xs text-stone-300 dark:text-stone-600">{about.copyright}</p>
      </div>
    </div>
  )
}
