import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import { ChevronRightIcon } from '../components/ui/Icons'

const rows: { label: string; icon: string; to?: string }[] = [
  { label: 'Profil', icon: '👤', to: '/mer/profil' },
  { label: 'Inställningar', icon: '⚙️' },
  { label: 'Notiser', icon: '🔔' },
  { label: 'Påminnelser', icon: '⏰' },
  { label: 'Hjälp & support', icon: '❓' },
  { label: 'Om appen', icon: 'ℹ️', to: '/mer/om' },
]

export function MorePage() {
  const navigate = useNavigate()

  function handleRow(row: (typeof rows)[number]) {
    if (row.to) navigate(row.to)
    else toast.info(`${row.label} kommer snart`)
  }

  return (
    <div className="px-5 pt-12 pb-4">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Mer</h1>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {rows.map((row, i) => (
          <button
            key={row.label}
            onClick={() => handleRow(row)}
            className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-stone-50 transition-colors ${
              i > 0 ? 'border-t border-stone-100' : ''
            }`}
          >
            <span className="text-lg w-7">{row.icon}</span>
            <span className="flex-1 text-left text-stone-800 font-medium">{row.label}</span>
            <ChevronRightIcon className="w-4 h-4 stroke-stone-300" />
          </button>
        ))}
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full text-center text-red-500 font-medium py-4 mt-4"
      >
        Logga ut
      </button>
    </div>
  )
}
