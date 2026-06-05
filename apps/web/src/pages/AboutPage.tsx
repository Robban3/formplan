import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '../components/ui/Icons'

export function AboutPage() {
  const navigate = useNavigate()
  return (
    <div className="px-5 pt-12 pb-4">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Om appen</h1>

      <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-3">
        <div className="text-center">
          <div className="text-4xl mb-2">🌲</div>
          <p className="font-bold text-stone-900">FormPlan</p>
          <p className="text-stone-400 text-sm">Version 0.1.0</p>
        </div>
        <p className="text-stone-500 text-sm leading-relaxed">
          FormPlan skapar personliga tränings- och kostscheman med hjälp av AI, anpassade efter
          dina mål, din erfarenhet och din utrustning.
        </p>
      </div>

      <p className="text-center text-stone-300 text-xs mt-6">Gjord med 💪 i Sverige</p>
    </div>
  )
}
