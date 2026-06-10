import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeftIcon, ScanBarcodeIcon } from '../../components/ui/Icons'
import { lookupBarcode, type ScannedProduct } from '../../lib/openFoodFacts'
import { nutritionApi, type MealSlot } from '../../lib/nutritionApi'
import { dateKey } from '../../lib/derive'
import { toast } from '../../lib/toast'

const SLOT_LABELS: Record<MealSlot, string> = {
  frukost: 'Frukost',
  lunch: 'Lunch',
  middag: 'Middag',
  mellanmar: 'Mellanmål',
}

// BarcodeDetector is not in the TS DOM lib yet — declare the bits we use.
interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}
interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorInstance
}

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']

export function BarcodeScanPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const slot = (params.get('slot') ?? 'frukost') as MealSlot
  const date = params.get('date') ?? dateKey()

  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null)

  const [scanning, setScanning] = useState(false)
  const [looking, setLooking] = useState(false)
  const [product, setProduct] = useState<ScannedProduct | null>(null)
  const [amount, setAmount] = useState('100')
  const [manual, setManual] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  function stopScan() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  async function startScan() {
    setError(null)
    setProduct(null)
    if (!supported) return
    try {
      const Ctor = (window as unknown as { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector
      detectorRef.current = new Ctor({ formats: BARCODE_FORMATS })
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setScanning(true)
      intervalRef.current = window.setInterval(async () => {
        const v = videoRef.current
        const d = detectorRef.current
        if (!v || !d || v.readyState < 2) return
        try {
          const codes = await d.detect(v)
          const code = codes[0]?.rawValue
          if (code) {
            stopScan()
            void doLookup(code)
          }
        } catch {
          /* transient detector errors — keep scanning */
        }
      }, 400)
    } catch {
      setError('Kunde inte starta kameran. Ange streckkoden manuellt nedan.')
      setScanning(false)
    }
  }

  // Attach the live stream once the <video> is mounted.
  useEffect(() => {
    if (scanning && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [scanning])

  // Auto-start the scanner on mount; always clean up the camera on unmount.
  useEffect(() => {
    if (supported) void startScan()
    return () => stopScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function doLookup(code: string) {
    setLooking(true)
    setError(null)
    try {
      const p = await lookupBarcode(code)
      if (p) {
        setProduct(p)
        setAmount(p.serving_size_g ? String(p.serving_size_g) : '100')
      } else {
        setError(`Hittade ingen produkt för streckkod ${code}.`)
      }
    } finally {
      setLooking(false)
    }
  }

  async function add() {
    if (!product) return
    const g = parseFloat(amount)
    if (isNaN(g) || g <= 0) return
    setAdding(true)
    try {
      const factor = g / 100
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
      toast.error((e as Error).message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-stone-50 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-white border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
          <ChevronLeftIcon className="w-5 h-5 stroke-stone-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Skanna streckkod</h1>
          <p className="text-xs text-stone-400">Lägger till i {SLOT_LABELS[slot].toLowerCase()}</p>
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
              Rikta kameran mot streckkoden
            </p>
          </div>
        )}

        {looking && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-stone-500">
            <div className="w-5 h-5 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            Söker produkt…
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {/* Product result */}
        {product && (
          <div className="bg-white rounded-2xl border border-stone-100 p-4">
            <p className="font-semibold text-stone-900">{product.name}</p>
            {product.brand && <p className="text-xs text-stone-400">{product.brand}</p>}
            <p className="text-xs text-stone-400 mt-1">
              Per 100 g: {product.kcal_per_100g} kcal · P {product.protein_per_100g}g · F {product.fat_per_100g}g · K{' '}
              {product.carbs_per_100g}g
            </p>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 py-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max="2000"
                  className="w-16 bg-transparent text-sm font-medium text-stone-800 text-right outline-none"
                />
                <span className="text-sm text-stone-400">g</span>
              </div>
              <p className="text-sm text-stone-500">
                {amount ? Math.round((product.kcal_per_100g * parseFloat(amount)) / 100) : 0} kcal
              </p>
            </div>

            <button
              onClick={add}
              disabled={adding || !amount || parseFloat(amount) <= 0}
              className="w-full mt-4 bg-forest-600 hover:bg-forest-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {adding ? 'Lägger till…' : 'Lägg till i kostdagbok'}
            </button>
          </div>
        )}

        {/* Rescan */}
        {supported && !scanning && (
          <button
            onClick={() => void startScan()}
            className="w-full py-3 bg-forest-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
          >
            <ScanBarcodeIcon className="w-5 h-5 stroke-white" />
            {product || error ? 'Skanna igen' : 'Starta skanning'}
          </button>
        )}

        {!supported && !product && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            Kameraskanning stöds inte i den här webbläsaren. Ange streckkoden manuellt nedan.
          </div>
        )}

        {/* Manual entry */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4">
          <p className="text-sm font-semibold text-stone-800 mb-2">Ange streckkod manuellt</p>
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="t.ex. 7310865004703"
              className="flex-1 bg-stone-100 rounded-xl px-4 py-2.5 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-forest-400"
            />
            <button
              onClick={() => {
                stopScan()
                void doLookup(manual)
              }}
              disabled={manual.length < 6 || looking}
              className="px-4 rounded-xl bg-forest-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              Sök
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
