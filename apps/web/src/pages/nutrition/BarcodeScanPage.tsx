import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeftIcon, ScanBarcodeIcon } from '../../components/ui/Icons'
import { lookupBarcode, type ScannedProduct } from '../../lib/openFoodFacts'
import { startBarcodeScanner, type ScannerHandle } from '../../lib/barcodeScanner'
import { getCustomFood, saveCustomFood } from '../../lib/customFoods'
import { nutritionApi, toMealSlot, type MealSlot } from '../../lib/nutritionApi'
import { dateKey } from '../../lib/derive'
import { toast } from '../../lib/toast'
import { mealSlotLabels } from '../../lib/texts'
import { GENERIC_ERROR, BUSY_ADDING } from '../../lib/texts'
import { NUTRITION_BASIS_G } from '../../lib/constants'
import { useT } from '../../hooks/useT'

export function BarcodeScanPage() {
  const { t } = useT()
  const SLOT_LABELS = mealSlotLabels(t)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const slot = toMealSlot(params.get('slot'))
  const date = params.get('date') ?? dateKey()

  const videoRef = useRef<HTMLVideoElement>(null)
  const handleRef = useRef<ScannerHandle | null>(null)
  const handledRef = useRef(false)

  const [scanning, setScanning] = useState(true)
  const [looking, setLooking] = useState(false)
  const [product, setProduct] = useState<ScannedProduct | null>(null)
  const [amount, setAmount] = useState('100')
  const [manual, setManual] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  // Streckkod som lästes men saknas i alla källor — då erbjuds egen inmatning.
  const [unknownCode, setUnknownCode] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', brand: '', kcal: '', protein: '', fat: '', carbs: '' })

  // Run the scanner whenever the camera viewport is showing. Works with the
  // native Barcode Detection API or, on iOS Safari, the ZXing fallback.
  useEffect(() => {
    if (!scanning) return
    const video = videoRef.current
    if (!video) return

    let cancelled = false
    handledRef.current = false

    startBarcodeScanner(video, (code) => {
      if (handledRef.current) return
      handledRef.current = true
      setScanning(false) // cleanup below stops the camera
      void doLookup(code)
    })
      .then((h) => {
        if (cancelled) h.stop()
        else handleRef.current = h
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('barcode.cameraFailed'))
          setScanning(false)
        }
      })

    return () => {
      cancelled = true
      handleRef.current?.stop()
      handleRef.current = null
    }
  }, [scanning])

  async function doLookup(code: string) {
    setLooking(true)
    setError(null)
    setUnknownCode(null)
    try {
      // Egna varor först: har användaren redan skrivit av paketet en gång ska
      // det inte kosta ett nätanrop — och svaret är dessutom bättre än Open
      // Food Facts generiska poster.
      const own = getCustomFood(code)
      if (own) {
        setProduct(own)
        setAmount(own.serving_size_g ? String(own.serving_size_g) : '100')
        return
      }
      const p = await lookupBarcode(code)
      if (p) {
        setProduct(p)
        setAmount(p.serving_size_g ? String(p.serving_size_g) : '100')
      } else {
        // Ingen återvändsgränd: erbjud att skriva av näringsdeklarationen.
        setUnknownCode(code)
        setForm({ name: '', brand: '', kcal: '', protein: '', fat: '', carbs: '' })
      }
    } finally {
      setLooking(false)
    }
  }

  /** Sparar den egna varan och visar den som vilket uppslag som helst. */
  function saveOwnFood() {
    if (!unknownCode) return
    const num = (v: string) => {
      // Svenskt decimalkomma är det normala på ett paket.
      const n = parseFloat(v.replace(',', '.'))
      return Number.isFinite(n) && n >= 0 ? n : 0
    }
    const own = {
      barcode: unknownCode,
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      kcal_per_100g: num(form.kcal),
      protein_per_100g: num(form.protein),
      fat_per_100g: num(form.fat),
      carbs_per_100g: num(form.carbs),
      serving_size_g: null,
    }
    if (!own.name) return
    saveCustomFood(own)
    setProduct(own)
    setAmount('100')
    setUnknownCode(null)
  }

  async function add() {
    if (!product) return
    const g = parseFloat(amount)
    if (isNaN(g) || g <= 0) return
    setAdding(true)
    try {
      const factor = g / NUTRITION_BASIS_G
      await nutritionApi.addLogEntry({
        date,
        meal_slot: slot,
        food_id: null,
        food_name: product.brand ? `${product.name} (${product.brand})` : product.name,
        amount_g: g,
        kcal: Math.round(product.kcal_per_100g * factor),
        protein_g: Math.round(product.protein_per_100g * factor * 10) / 10,
        fat_g: Math.round(product.fat_per_100g * factor * 10) / 10,
        carbs_g: Math.round(product.carbs_per_100g * factor * 10) / 10,
      })
      toast.success('Tillagt i kostdagboken')
      navigate(-1)
    } catch (e) {
      toast.error((e as Error).message ?? GENERIC_ERROR)
    } finally {
      setAdding(false)
    }
  }

  function rescan() {
    setProduct(null)
    setError(null)
    setUnknownCode(null)
    setScanning(true)
  }

  return (
    <div className="flex flex-col min-h-full bg-canvas pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-header pb-3 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700">
          <ChevronLeftIcon className="w-5 h-5 stroke-stone-600 dark:stroke-stone-300" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">{t('barcode.scanTitle')}</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">{t('food.addingToSlot', { slot: SLOT_LABELS[slot].toLowerCase() })}</p>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {/* Camera viewport */}
        {scanning && (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2/3 h-24 border-2 border-white/80 rounded-xl" />
            </div>
            <p className="absolute bottom-2 inset-x-0 text-center text-xs text-white/90">
              {t('barcode.aimCamera')}
            </p>
          </div>
        )}

        {looking && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-stone-500 dark:text-stone-400">
            <div className="w-5 h-5 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            {t('barcode.searching')}
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {/* Okänd streckkod — skriv av näringsdeklarationen en gång, så känns
            varan igen nästa gång. Open Food Facts saknar stora delar av det
            svenska sortimentet, särskilt butikernas egna märken. */}
        {unknownCode && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
            <p className="font-semibold text-stone-900 dark:text-stone-100">{t('barcode.notInDatabase')}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {t('barcode.unknownCodeHint', { code: unknownCode })}
            </p>

            <div className="space-y-2 mt-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('barcode.namePlaceholder')}
                className="w-full bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-2.5 text-sm text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-forest-400"
              />
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder={t('barcode.brandPlaceholder')}
                className="w-full bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-2.5 text-sm text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-forest-400"
              />
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 pt-1">{t('food.per100gShort')}</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['kcal', 'Kalorier'],
                  ['protein', t('barcode.proteinG')],
                  ['fat', t('barcode.fatG')],
                  ['carbs', 'Kolhydrater (g)'],
                ] as const).map(([field, label]) => (
                  <input
                    key={field}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    inputMode="decimal"
                    placeholder={label}
                    className="bg-stone-100 dark:bg-stone-700 rounded-xl px-3 py-2.5 text-sm text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-forest-400"
                  />
                ))}
              </div>
            </div>

            <button
              onClick={saveOwnFood}
              disabled={!form.name.trim() || !form.kcal.trim()}
              className="w-full mt-4 bg-forest-700 hover:bg-forest-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {t('barcode.saveProduct')}
            </button>
          </div>
        )}

        {/* Product result */}
        {product && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
            <p className="font-semibold text-stone-900 dark:text-stone-100">{product.name}</p>
            {product.brand && <p className="text-xs text-stone-500 dark:text-stone-400">{product.brand}</p>}
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {t('food.per100gMacros', {
                kcal: product.kcal_per_100g,
                protein: product.protein_per_100g,
                fat: product.fat_per_100g,
                carbs: product.carbs_per_100g,
              })}
            </p>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-700 rounded-xl px-3 py-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max="2000"
                  className="w-16 bg-transparent text-sm font-medium text-stone-800 dark:text-stone-200 text-right outline-none focus-visible:ring-2 focus-visible:ring-forest-500 rounded"
                />
                <span className="text-sm text-stone-500 dark:text-stone-400">g</span>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {amount ? Math.round((product.kcal_per_100g * parseFloat(amount)) / NUTRITION_BASIS_G) : 0} kcal
              </p>
            </div>

            <button
              onClick={add}
              disabled={adding || !amount || parseFloat(amount) <= 0}
              className="w-full mt-4 bg-forest-700 hover:bg-forest-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {adding ? BUSY_ADDING : t('food.addToDiary')}
            </button>
          </div>
        )}

        {/* Rescan */}
        {!scanning && (
          <button
            onClick={rescan}
            className="w-full py-3 bg-forest-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
          >
            <ScanBarcodeIcon className="w-5 h-5 stroke-white" />
            {product || error ? 'Skanna igen' : 'Starta skanning'}
          </button>
        )}

        {/* Manual entry */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">{t('barcode.manualEntry')}</p>
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="t.ex. 7310865004703"
              className="flex-1 bg-stone-100 dark:bg-stone-700 rounded-xl px-4 py-2.5 text-sm text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-forest-400"
            />
            <button
              onClick={() => {
                setScanning(false)
                void doLookup(manual)
              }}
              disabled={manual.length < 6 || looking}
              className="px-4 rounded-xl bg-forest-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {t('common.search')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
