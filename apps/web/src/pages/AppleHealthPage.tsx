import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '../components/ui/Icons'

export function AppleHealthPage() {
  const navigate = useNavigate()
  return (
    <div className="px-5 pt-12 pb-4">
      <button onClick={() => navigate('/mer')} className="flex items-center gap-1 text-stone-400 text-sm mb-4">
        <ChevronLeftIcon className="w-4 h-4 stroke-stone-400" />
        Mer
      </button>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Apple Health</h1>

      <div className="bg-white rounded-2xl border border-stone-100 p-6 text-center space-y-4">
        <div className="text-5xl">❤️</div>
        <p className="font-semibold text-stone-800">Kommer i native-appen</p>
        <p className="text-stone-400 text-sm leading-relaxed">
          Apple Health-integrationen kräver en native iOS-app och är inte tillgänglig i
          webbversionen. Dina pass och vikt loggas redan i FormPlan och kan synkroniseras
          när iOS-appen lanseras.
        </p>
      </div>

      <div className="bg-forest-50 rounded-2xl border border-forest-100 p-4 mt-4 space-y-2">
        <p className="font-medium text-forest-800 text-sm">Vad som synkroniseras (iOS-app):</p>
        <ul className="text-forest-700 text-sm space-y-1">
          <li>✓ Genomförda träningspass (typ, tid, kalorier)</li>
          <li>✓ Aktiva kalorier och steg</li>
          <li>✓ Vikt och BMI</li>
          <li>✓ Näring och makron</li>
        </ul>
      </div>
    </div>
  )
}
