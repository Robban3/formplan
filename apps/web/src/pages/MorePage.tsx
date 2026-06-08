import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  UserIcon,
  SettingsIcon,
  BellIcon,
  ClockIcon,
  HeartIcon,
  HelpCircleIcon,
  InfoIcon,
  LogOutIcon,
  ChevronRightIcon,
  TargetIcon,
  BookOpenIcon,
  BarChartIcon,
  TrophyIcon,
  BotIcon,
} from '../components/ui/Icons'

type IconComponent = React.ComponentType<{ className?: string }>

const rows: { label: string; Icon: IconComponent; to: string }[] = [
  { label: 'Mina mål',          Icon: TargetIcon,      to: '/mer/mina-mal' },
  { label: 'Utmaningar',        Icon: TrophyIcon,      to: '/mer/utmaningar' },
  { label: 'AI-coach',          Icon: BotIcon,         to: '/mer/ai-coach' },
  { label: 'Kroppsmätningar',   Icon: BarChartIcon,    to: '/mer/matningar' },
  { label: 'Recept',            Icon: BookOpenIcon,    to: '/mer/recept' },
  { label: 'Profil',        Icon: UserIcon,        to: '/mer/profil' },
  { label: 'Inställningar', Icon: SettingsIcon,    to: '/mer/installningar' },
  { label: 'Notiser',       Icon: BellIcon,        to: '/mer/notiser' },
  { label: 'Påminnelser',   Icon: ClockIcon,       to: '/mer/paminnelser' },
  { label: 'Apple Health',  Icon: HeartIcon,       to: '/mer/apple-health' },
  { label: 'Hjälp & support', Icon: HelpCircleIcon, to: '/mer/hjalp' },
  { label: 'Om appen',      Icon: InfoIcon,        to: '/mer/om' },
]

export function MorePage() {
  const navigate = useNavigate()

  return (
    <div className="px-5 pt-12 pb-4">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Mer</h1>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {rows.map((row, i) => (
          <button
            key={row.label}
            onClick={() => navigate(row.to)}
            className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-stone-50 transition-colors ${
              i > 0 ? 'border-t border-stone-100' : ''
            }`}
          >
            <row.Icon className="w-5 h-5 stroke-stone-400 flex-shrink-0" />
            <span className="flex-1 text-left text-stone-800 font-medium">{row.label}</span>
            <ChevronRightIcon className="w-4 h-4 stroke-stone-300" />
          </button>
        ))}
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-4 mt-4"
      >
        <LogOutIcon className="w-4 h-4 stroke-red-500" />
        Logga ut
      </button>
    </div>
  )
}
