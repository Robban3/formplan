import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { ChevronLeftIcon } from '../components/ui/Icons'

interface FitnessProfile {
  goal: string
  level: string
  equipment: string[]
  days_per_week: number
  allergies: string[]
  calorie_goal: number | null
  age: number | null
  weight_kg: number | null
  height_cm: number | null
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Gå ner i vikt',
  build_muscle: 'Bygga muskler',
  maintain: 'Hålla formen',
  improve_endurance: 'Förbättra kondition',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Nybörjare',
  intermediate: 'Mellannivå',
  advanced: 'Avancerad',
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<FitnessProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getProfile()
      .then(({ profile }) => setProfile(profile as FitnessProfile | null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const rows: { label: string; value: string }[] = profile
    ? [
        { label: 'Mål', value: GOAL_LABELS[profile.goal] ?? profile.goal },
        { label: 'Nivå', value: LEVEL_LABELS[profile.level] ?? profile.level },
        { label: 'Dagar / vecka', value: String(profile.days_per_week) },
        { label: 'Utrustning', value: profile.equipment.join(', ') || '—' },
        { label: 'Allergier', value: profile.allergies.join(', ') || 'Inga' },
        { label: 'Kalorimål', value: profile.calorie_goal ? `${profile.calorie_goal} kcal` : 'Auto' },
        { label: 'Ålder', value: profile.age ? `${profile.age} år` : '—' },
        { label: 'Vikt', value: profile.weight_kg ? `${profile.weight_kg} kg` : '—' },
        { label: 'Längd', value: profile.height_cm ? `${profile.height_cm} cm` : '—' },
      ]
    : []

  return (
    <div className="px-5 pt-header pb-4">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Profil</h1>

      {profile ? (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-stone-50' : ''}`}
            >
              <span className="text-stone-500 text-sm">{row.label}</span>
              <span className="text-stone-800 font-medium text-sm text-right max-w-[60%]">{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-stone-400 text-sm">Ingen profil hittades.</p>
      )}

      <button
        onClick={() => navigate('/onboarding')}
        className="w-full mt-4 border border-stone-200 rounded-xl py-3 text-sm text-stone-600 hover:border-forest-400 hover:text-forest-600 transition-colors"
      >
        Uppdatera mina uppgifter
      </button>
    </div>
  )
}
