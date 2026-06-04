import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const name = user?.user_metadata?.['full_name']?.split(' ')[0] ?? 'där'

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-stone-400 text-sm">Hej, {name} 👋</p>
          <h1 className="text-2xl font-bold text-stone-900">Redo att nå dina mål idag?</h1>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={() => navigate('/traning')}
          className="bg-forest-600 text-white rounded-2xl p-5 text-left"
        >
          <span className="text-2xl">🏋️</span>
          <p className="font-semibold mt-2">Träning</p>
          <p className="text-forest-200 text-xs">Se dagens pass</p>
        </button>
        <button
          onClick={() => navigate('/kost')}
          className="bg-white border border-stone-200 rounded-2xl p-5 text-left"
        >
          <span className="text-2xl">🥗</span>
          <p className="font-semibold mt-2">Kost</p>
          <p className="text-stone-400 text-xs">Logga måltid</p>
        </button>
      </div>
    </div>
  )
}
