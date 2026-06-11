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

const FEATURES = [
  {
    Icon: DumbbellIcon,
    title: 'AI-genererade träningsprogram',
    desc: 'Få ett komplett träningsschema byggt kring dina mål, din erfarenhetsnivå och den utrustning du har tillgång till — hemma eller på gym.',
    bg: 'bg-forest-50',
    stroke: 'stroke-forest-600',
  },
  {
    Icon: LeafIcon,
    title: 'Kostdagbok & makrospårning',
    desc: 'Logga måltider snabbt med vår livsmedelsdatabas. Följ protein, kolhydrater, fett och kalorier dag för dag.',
    bg: 'bg-sky-50',
    stroke: 'stroke-sky-600',
  },
  {
    Icon: TargetIcon,
    title: 'Personliga mål',
    desc: 'Sätt konkreta mål — vikt, styrka eller kondition — och se din framsteg spåras automatiskt i realtid.',
    bg: 'bg-purple-50',
    stroke: 'stroke-purple-600',
  },
  {
    Icon: BarChartIcon,
    title: 'Analys & progression',
    desc: 'Visualisera din viktkurva med rullande medelvärde, följ personbästa per övning och se hur ditt kaloriintag förhåller sig till ditt mål.',
    bg: 'bg-amber-50',
    stroke: 'stroke-amber-600',
  },
  {
    Icon: TrophyIcon,
    title: 'Utmaningar',
    desc: 'Ta dig an tidsbegränsade utmaningar för att hålla motivationen uppe — från 30-dagarsträning till hydreringsvanor.',
    bg: 'bg-orange-50',
    stroke: 'stroke-orange-500',
  },
  {
    Icon: BotIcon,
    title: 'AI-coach',
    desc: 'Ställ frågor om träning och kost direkt i appen. Coachen känner till din data och ger svar anpassade till dig.',
    bg: 'bg-rose-50',
    stroke: 'stroke-rose-500',
  },
]

export function AboutPage() {
  const navigate = useNavigate()
  return (
    <div className="pb-10">
      <div className="px-5 pt-header pb-4">
        <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
          <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
          Mer
        </button>
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Om FormPlan</h1>
        <p className="text-sm text-stone-400">Version 0.1.0</p>
      </div>

      {/* Hero */}
      <div className="mx-5 bg-forest-700 rounded-2xl p-6 text-white mb-5">
        <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mb-4">
          <DumbbellIcon className="w-6 h-6 stroke-white" />
        </div>
        <h2 className="text-xl font-bold mb-2">Träna smartare, inte hårdare</h2>
        <p className="text-sm text-forest-100 leading-relaxed">
          FormPlan är din personliga hälsoapp som kombinerar AI-genererade träningsprogram med
          noggrann kostspårning. Oavsett om du vill bygga muskler, gå ner i vikt eller bara
          röra på dig mer — FormPlan anpassar sig efter dig och följer med på hela resan.
        </p>
      </div>

      {/* Mission */}
      <div className="mx-5 bg-white rounded-2xl border border-stone-100 p-5 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <HeartIcon className="w-4 h-4 stroke-rose-400" />
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Vår tanke</p>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">
          Vi tror att bra träning och hållbar kost inte ska kräva en personlig tränare eller
          dietist. Genom att kombinera modern AI med ett enkelt gränssnitt vill vi göra det
          lätt för alla att ta kontroll över sin hälsa — på sina egna villkor.
        </p>
      </div>

      {/* Feature list */}
      <div className="px-5 space-y-3 mb-6">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Funktioner</p>
        {FEATURES.map(({ Icon, title, desc, bg, stroke }) => (
          <div key={title} className="flex items-start gap-3 bg-white rounded-2xl border border-stone-100 p-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${stroke}`} />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">{title}</p>
              <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 text-center space-y-1">
        <p className="text-xs text-stone-400">Designad och utvecklad i Sverige</p>
        <p className="text-xs text-stone-300">© 2026 FormPlan. Alla rättigheter förbehållna.</p>
      </div>
    </div>
  )
}
