export interface CompressedImage {
  /** Base64 payload without the data-URL prefix (for the API). */
  base64: string
  /** Full data URL for preview rendering. */
  dataUrl: string
  mediaType: 'image/jpeg'
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Kunde inte läsa bilden'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Kunde inte ladda bilden'))
    img.src = src
  })
}

/**
 * Downscale to fit within `maxSize` px and re-encode as JPEG so uploads stay
 * small enough for the vision endpoint regardless of the original photo size.
 */
export async function compressImage(
  file: File,
  maxSize = 1024,
  quality = 0.8
): Promise<CompressedImage> {
  const original = await readAsDataUrl(file)
  const img = await loadImage(original)

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas stöds inte')
  ctx.drawImage(img, 0, 0, w, h)

  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  return { base64: dataUrl.split(',')[1] ?? '', dataUrl, mediaType: 'image/jpeg' }
}
