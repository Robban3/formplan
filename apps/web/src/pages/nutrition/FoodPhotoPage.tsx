import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeftIcon, CameraIcon, FireIcon } from '../../components/ui/Icons'
import { api, ApiError, type FoodPhotoAnalysis } from '../../lib/api'
import { compressImage } from '../../lib/image'
import { nutritionApi, toMealSlot, type MealSlot } from '../../lib/nutritionApi'
import { dateKey } from '../../lib/derive'
import { toast } from '../../lib/toast'

const SLOT_LABELS: Record<MealSlot, string> = {
  frukost: 'Frukost',
  lunch: 'Lunch',
  middag: 'Middag',
  mellanmar: 'Mellanmål',
}

export function FoodPhotoPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const slot = toMealSlot(params.get('slot'))
  const date = params.get('date') ?? dateKey()

  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<FoodPhotoAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onPick(file: File | undefined) {
    if (!file) return
    setError(null)
    setAnalysis(null)
    try {
      const { base64, dataUrl, mediaType } = await compressImage(file)
      setPreview(dataUrl)
      setAnalyzing(true)
      const { analysis } = await api.analyzeFoodPhoto(base64, mediaType)
      setAnalysis(analysis)
    } catch (e) {
      console.error('Food photo analysis failed:', e)
      if (e instanceof ApiError && e.status === 402) {
        setError('Fotoanalys är en Premium-funktion. Uppgradera under Mer → Premium för att fortsätta.')
      } else if (e instanceof ApiError) {
        // Server returns a clean, user-friendly message (no links/internal detail).
        setError(e.message)
      } else {
        setError('Kunde inte analysera bilden. Försök igen med en tydligare bild.')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  async function logAll() {
    if (!analysis || analysis.items.length === 0 || saving) return
    setSaving(true)
    try {
      // One atomic request — a per-item loop duplicates entries on retry.
      await nutritionApi.addLogEntries(
        analysis.items.map((item) => ({
          date,
          meal_slot: slot,
          food_id: null,
          food_name: item.name,
          amount_g: item.amount_g,
          kcal: item.kcal,
          protein_g: item.protein_g,
          fat_g: item.fat_g,
          carbs_g: item.carbs_g,
        }))
      )
      toast.success('Tillagt i kostdagboken')
      navigate(-1)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const hasItems = !!analysis && analysis.items.length > 0

  return (
    <div className="flex flex-col min-h-full bg-canvas pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-header pb-3 bg-white border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
          <ChevronLeftIcon className="w-5 h-5 stroke-stone-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Fotografera måltid</h1>
          <p className="text-xs text-stone-400">Lägger till i {SLOT_LABELS[slot].toLowerCase()}</p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Reset so picking the same photo again re-fires onChange.
          e.target.value = ''
          onPick(file)
        }}
      />

      <div className="px-5 mt-5 space-y-4">
        {/* Preview / capture */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={analyzing}
          className="w-full aspect-square max-h-72 rounded-2xl border-2 border-dashed border-stone-200 bg-white flex flex-col items-center justify-center gap-2 overflow-hidden disabled:opacity-60"
        >
          {preview ? (
            <img src={preview} alt="Förhandsvisning" className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center">
                <CameraIcon className="w-7 h-7 stroke-forest-600" />
              </div>
              <p className="text-sm font-medium text-stone-600">Ta en bild eller välj från galleriet</p>
              <p className="text-xs text-stone-400">AI uppskattar kalorier och makron</p>
            </>
          )}
        </button>

        {preview && !analyzing && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 rounded-xl border border-stone-200 text-sm text-stone-500 font-medium hover:border-forest-400 hover:text-forest-600 transition-colors"
          >
            Ta ny bild
          </button>
        )}

        {analyzing && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-stone-500">
            <div className="w-5 h-5 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            Analyserar bilden…
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {/* Result */}
        {analysis && !analyzing && (
          <div className="bg-white rounded-2xl border border-stone-100 p-4">
            <p className="font-semibold text-stone-900">{analysis.description}</p>

            {hasItems ? (
              <>
                <div className="mt-3 flex items-center gap-2 text-sm text-stone-500">
                  <FireIcon className="w-4 h-4 stroke-forest-600" />
                  <span className="font-bold text-stone-800">{analysis.total.kcal} kcal</span>
                  <span className="text-stone-400">
                    · P {Math.round(analysis.total.protein_g)}g · F {Math.round(analysis.total.fat_g)}g · K{' '}
                    {Math.round(analysis.total.carbs_g)}g
                  </span>
                </div>

                <div className="mt-3 divide-y divide-stone-50">
                  {analysis.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                        <p className="text-xs text-stone-400">
                          {item.amount_g} g · P {item.protein_g}g · F {item.fat_g}g · K {item.carbs_g}g
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-stone-700 ml-3 flex-shrink-0">{item.kcal} kcal</span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-stone-400 mt-3">
                  Uppskattning av AI — justera i kostdagboken vid behov.
                </p>

                <button
                  onClick={logAll}
                  disabled={saving}
                  className="w-full mt-3 bg-forest-700 hover:bg-forest-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
                >
                  {saving ? 'Lägger till…' : 'Lägg till i kostdagbok'}
                </button>
              </>
            ) : (
              <p className="text-sm text-stone-400 mt-2">Prova en tydligare bild på maten.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
