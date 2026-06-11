import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getActiveChallenges,
  getAvailablePresets,
  getCompletedChallenges,
  startChallenge,
  abandonChallenge,
  type Challenge,
  type ChallengeIconKey,
} from '../lib/challengesStore'
import {
  ChevronLeftIcon,
  TrophyIcon,
  ZapIcon,
  FireIcon,
  DumbbellIcon,
  DropletIcon,
  TargetIcon,
} from '../components/ui/Icons'
import type { ComponentType } from 'react'

const ICON_MAP: Record<ChallengeIconKey, ComponentType<{ className?: string }>> = {
  flame:    FireIcon,
  dumbbell: DumbbellIcon,
  zap:      ZapIcon,
  droplet:  DropletIcon,
  target:   TargetIcon,
  trophy:   TrophyIcon,
}

const ICON_STYLE: Record<ChallengeIconKey, { bg: string; stroke: string }> = {
  flame:    { bg: 'bg-red-50',    stroke: 'stroke-red-500' },
  dumbbell: { bg: 'bg-forest-50', stroke: 'stroke-forest-600' },
  zap:      { bg: 'bg-amber-50',  stroke: 'stroke-amber-500' },
  droplet:  { bg: 'bg-sky-50',    stroke: 'stroke-sky-500' },
  target:   { bg: 'bg-purple-50', stroke: 'stroke-purple-500' },
  trophy:   { bg: 'bg-amber-50',  stroke: 'stroke-amber-500' },
}

const CATEGORY_LABELS: Record<string, string> = {
  training: 'Träning',
  nutrition: 'Kost',
  body: 'Kropp',
}

const CATEGORY_COLORS: Record<string, string> = {
  training: 'bg-forest-50 text-forest-700 border-forest-200',
  nutrition: 'bg-sky-50 text-sky-700 border-sky-200',
  body: 'bg-purple-50 text-purple-700 border-purple-200',
}

function ChallengeIcon({ iconKey }: { iconKey: ChallengeIconKey | undefined }) {
  const Icon = (iconKey != null && ICON_MAP[iconKey]) ? ICON_MAP[iconKey] : DumbbellIcon
  const style = (iconKey != null && ICON_STYLE[iconKey]) ? ICON_STYLE[iconKey] : { bg: 'bg-forest-50', stroke: 'stroke-forest-600' }
  return (
    <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-5 h-5 ${style.stroke}`} />
    </div>
  )
}

function ChallengeCard({ challenge, onAbandon }: { challenge: Challenge; onAbandon: () => void }) {
  const daysLeft = challenge.startDate
    ? Math.max(0, challenge.durationDays - Math.floor(
        (Date.now() - new Date(challenge.startDate).getTime()) / 86400000
      ))
    : challenge.durationDays

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4">
      <div className="flex items-start gap-3 mb-3">
        <ChallengeIcon iconKey={challenge.iconKey} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900">{challenge.title}</p>
          <p className="text-xs text-stone-500 mt-0.5">{challenge.description}</p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[challenge.category]}`}>
          {CATEGORY_LABELS[challenge.category]}
        </span>
      </div>

      <div className="mb-1 flex justify-between text-xs text-stone-500">
        <span>{challenge.currentValue} / {challenge.targetValue} {challenge.unit}</span>
        <span>{daysLeft} dagar kvar</span>
      </div>
      <div className="w-full bg-stone-100 rounded-full h-2 mb-3">
        <div
          className="bg-forest-700 h-2 rounded-full transition-all"
          style={{ width: `${challenge.progress}%` }}
        />
      </div>

      <button
        onClick={onAbandon}
        className="text-xs text-stone-400 hover:text-red-400 transition-colors"
      >
        Avbryt utmaning
      </button>
    </div>
  )
}

export function ChallengesPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState(getActiveChallenges)
  const [available, setAvailable] = useState(getAvailablePresets)
  const [completed, setCompleted] = useState(getCompletedChallenges)

  function handleStart(id: string) {
    startChallenge(id)
    setActive(getActiveChallenges())
    setAvailable(getAvailablePresets())
  }

  function handleAbandon(id: string) {
    if (!confirm('Avbryta utmaningen?')) return
    abandonChallenge(id)
    setActive(getActiveChallenges())
    setAvailable(getAvailablePresets())
    setCompleted(getCompletedChallenges())
  }

  return (
    <div className="pb-8">
      <div className="px-5 pt-header pb-4 bg-white border-b border-stone-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
          <ChevronLeftIcon className="w-5 h-5 stroke-stone-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Utmaningar</h1>
          <p className="text-xs text-stone-400">Sätt extra mål och håll motivationen uppe</p>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-6">
        {/* Aktiva utmaningar */}
        {active.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ZapIcon className="w-4 h-4 stroke-amber-500" />
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Pågående</p>
            </div>
            <div className="space-y-3">
              {active.map((c) => (
                <ChallengeCard key={c.id} challenge={c} onAbandon={() => handleAbandon(c.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Tillgängliga utmaningar */}
        {available.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Starta en utmaning</p>
            <div className="space-y-3">
              {available.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl border border-stone-100 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <ChallengeIcon iconKey={c.iconKey} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900">{c.title}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{c.description}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[c.category]}`}>
                      {CATEGORY_LABELS[c.category]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-stone-400">{c.durationDays} dagar · Mål: {c.targetValue} {c.unit}</p>
                    <button
                      onClick={() => handleStart(c.id)}
                      className="px-4 py-1.5 bg-forest-700 text-white text-xs font-semibold rounded-full"
                    >
                      Starta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avklarade */}
        {completed.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrophyIcon className="w-4 h-4 stroke-amber-500" />
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Avklarade</p>
            </div>
            <div className="space-y-2">
              {completed.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-amber-50 rounded-2xl border border-amber-100 px-4 py-3">
                  <ChallengeIcon iconKey={c.iconKey} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-900">{c.title}</p>
                    <p className="text-xs text-stone-400">{c.completedDate ?? ''}</p>
                  </div>
                  <TrophyIcon className="w-5 h-5 stroke-amber-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {active.length === 0 && available.length === 0 && completed.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <TargetIcon className="w-7 h-7 stroke-stone-300" />
            </div>
            <p className="font-semibold text-stone-700">Inga utmaningar ännu</p>
            <p className="text-sm text-stone-400 mt-1">Starta en utmaning för att hålla motivationen uppe!</p>
          </div>
        )}
      </div>
    </div>
  )
}
