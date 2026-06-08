import { useNavigate } from 'react-router-dom'
import {
  DumbbellIcon,
  LeafIcon,
  BotIcon,
  BarChartIcon,
  TargetIcon,
  TrophyIcon,
  CheckIcon,
} from '../components/ui/Icons'

const FEATURES = [
  {
    Icon: DumbbellIcon,
    title: 'AI-genererade träningsprogram',
    desc: 'Få ett komplett schema anpassat efter dina mål, din erfarenhet och din utrustning — på sekunder.',
    bg: 'bg-forest-50',
    stroke: 'stroke-forest-600',
  },
  {
    Icon: LeafIcon,
    title: 'Kostdagbok & makrospårning',
    desc: 'Logga måltider snabbt, följ protein och kalorier och nå dina kostmål dag för dag.',
    bg: 'bg-sky-50',
    stroke: 'stroke-sky-600',
  },
  {
    Icon: BarChartIcon,
    title: 'Analys & progression',
    desc: 'Visualisera din viktutveckling, personbästa och träningsvolym med tydliga grafer.',
    bg: 'bg-amber-50',
    stroke: 'stroke-amber-600',
  },
  {
    Icon: BotIcon,
    title: 'AI-coach dygnet runt',
    desc: 'Ställ frågor om träning och kost direkt i appen — coachen känner till din data.',
    bg: 'bg-rose-50',
    stroke: 'stroke-rose-500',
  },
  {
    Icon: TargetIcon,
    title: 'Personliga mål',
    desc: 'Sätt konkreta mål och följ framstegen automatiskt i realtid.',
    bg: 'bg-purple-50',
    stroke: 'stroke-purple-600',
  },
  {
    Icon: TrophyIcon,
    title: 'Utmaningar',
    desc: 'Ta dig an tidsbegränsade utmaningar för att hålla motivationen uppe.',
    bg: 'bg-orange-50',
    stroke: 'stroke-orange-500',
  },
]

const INCLUDED = [
  'AI-genererat träningsschema',
  'Kostdagbok med makrospårning',
  'Viktlogg med trendgraf',
  'Personbästa-spårning',
  'Mål & utmaningar',
  'AI-coach',
  'Fungerar offline',
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
            <DumbbellIcon className="w-4 h-4 stroke-white" />
          </div>
          <span className="font-bold text-stone-900">FormPlan</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/auth')}
            className="text-sm font-medium text-stone-600"
          >
            Logga in
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="text-sm font-semibold bg-forest-600 text-white px-4 py-2 rounded-xl"
          >
            Kom igång
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-5 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-forest-50 text-forest-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-forest-200 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-forest-500" />
          Gratis att komma igång
        </div>
        <h1 className="text-4xl font-extrabold text-stone-900 leading-tight mb-4">
          Träna smartare,<br />
          <span className="text-forest-600">inte hårdare</span>
        </h1>
        <p className="text-stone-500 text-base leading-relaxed max-w-sm mx-auto mb-8">
          FormPlan skapar personliga tränings- och kostscheman med AI, anpassade
          just efter dig — dina mål, din erfarenhet och din utrustning.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="w-full max-w-xs mx-auto block bg-forest-600 hover:bg-forest-700 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-sm shadow-forest-200"
        >
          Skapa konto gratis
        </button>
        <p className="text-xs text-stone-400 mt-3">Inget kreditkort krävs</p>
      </section>

      {/* App mockup */}
      <section className="px-5 pb-12">
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden mx-auto max-w-xs">
          {/* Fake status bar */}
          <div className="bg-forest-600 px-5 pt-10 pb-6 text-white">
            <p className="text-xs text-forest-200 mb-1">God morgon, Alex</p>
            <h2 className="text-xl font-bold">Ditt schema idag</h2>
          </div>
          <div className="p-4 space-y-3">
            {['Bröst & triceps', 'Rygg & biceps', 'Ben & core'].map((name, i) => (
              <div key={name} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-forest-50 flex items-center justify-center flex-shrink-0">
                  <DumbbellIcon className="w-4 h-4 stroke-forest-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-800">{name}</p>
                  <p className="text-xs text-stone-400">{['Måndag', 'Onsdag', 'Fredag'][i]}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-forest-500' : 'bg-stone-200'}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 pb-12">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4 text-center">Allt du behöver</p>
        <div className="space-y-3">
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
      </section>

      {/* What's included */}
      <section className="mx-5 mb-12 bg-forest-600 rounded-3xl p-6 text-white">
        <p className="text-xs font-semibold text-forest-200 uppercase tracking-wide mb-1">Gratisversionen inkluderar</p>
        <h2 className="text-xl font-bold mb-4">Allt för att komma igång</h2>
        <div className="space-y-2.5">
          {INCLUDED.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckIcon className="w-3 h-3 stroke-white" />
              </div>
              <span className="text-sm text-forest-50">{item}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => window.location.href = '/auth'}
          className="w-full mt-6 bg-white text-forest-700 font-bold py-3.5 rounded-2xl text-sm"
        >
          Kom igång gratis
        </button>
      </section>

      {/* Footer */}
      <footer className="px-5 py-8 text-center border-t border-stone-100 bg-white">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 bg-forest-600 rounded-lg flex items-center justify-center">
            <DumbbellIcon className="w-3.5 h-3.5 stroke-white" />
          </div>
          <span className="font-bold text-stone-900">FormPlan</span>
        </div>
        <p className="text-xs text-stone-400 mb-1">Designad och utvecklad i Sverige</p>
        <p className="text-xs text-stone-300">© 2026 FormPlan. Alla rättigheter förbehållna.</p>
      </footer>
    </div>
  )
}
