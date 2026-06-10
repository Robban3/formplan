export interface ScannerHandle {
  stop: () => void
}

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']

interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}
interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorInstance
}

/** True on browsers with the native (fast) Barcode Detection API. */
export function hasNativeBarcodeDetector(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
}

// Native path: drive a getUserMedia stream and poll BarcodeDetector.
async function startNative(
  video: HTMLVideoElement,
  onDetected: (code: string) => void
): Promise<ScannerHandle> {
  const Ctor = (window as unknown as { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector
  const detector = new Ctor({ formats: FORMATS })
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })

  video.srcObject = stream
  video.setAttribute('playsinline', 'true')
  await video.play().catch(() => {})

  let stopped = false
  const interval = window.setInterval(async () => {
    if (stopped || video.readyState < 2) return
    try {
      const codes = await detector.detect(video)
      const code = codes[0]?.rawValue
      if (code) onDetected(code)
    } catch {
      /* transient detector errors — keep scanning */
    }
  }, 400)

  return {
    stop: () => {
      stopped = true
      clearInterval(interval)
      stream.getTracks().forEach((t) => t.stop())
      video.srcObject = null
    },
  }
}

// Fallback path (e.g. iOS Safari): ZXing decodes in JS. Lazy-loaded so it
// stays out of the main bundle.
async function startZXing(
  video: HTMLVideoElement,
  onDetected: (code: string) => void
): Promise<ScannerHandle> {
  const { BrowserMultiFormatReader } = await import('@zxing/browser')
  const reader = new BrowserMultiFormatReader()
  const controls = await reader.decodeFromConstraints(
    { video: { facingMode: 'environment' } },
    video,
    (result) => {
      if (result) onDetected(result.getText())
    }
  )
  return { stop: () => controls.stop() }
}

/**
 * Start scanning into the given <video>, calling `onDetected` with each decoded
 * barcode. Uses the native detector when available, otherwise ZXing — so it
 * works across Chrome/Android and iOS Safari. Returns a handle to stop and
 * release the camera.
 */
export function startBarcodeScanner(
  video: HTMLVideoElement,
  onDetected: (code: string) => void
): Promise<ScannerHandle> {
  return hasNativeBarcodeDetector()
    ? startNative(video, onDetected)
    : startZXing(video, onDetected)
}
