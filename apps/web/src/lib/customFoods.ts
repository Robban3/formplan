import type { ScannedProduct } from './openFoodFacts'

/**
 * Egna varor, nycklade på streckkod.
 *
 * Open Food Facts är crowdsourcad och saknar stora delar av det svenska
 * sortimentet — butikernas egna märken i synnerhet. Skanningen fungerar, men
 * uppslaget ger ingenting, och användaren står i en återvändsgränd med paketet
 * i handen. Här kan hen i stället skriva av näringsdeklarationen en gång, varpå
 * samma streckkod känns igen direkt nästa gång.
 *
 * Lagras lokalt. Nyckeln bär avsiktligt `formplan_`-prefixet, vilket betyder att
 * `clearLocalUserData()` rensar den vid utloggning och kontobyte. Det är ett
 * medvetet val: näringsvärdena i sig är objektiva, men LISTAN över vad någon
 * skannat säger en del om kost, hälsa och vanor, och den ska inte ligga kvar på
 * en delad enhet efter utloggning. Appen lovar i integritetspolicyn att
 * lokal data försvinner — då ska den göra det.
 */

const KEY = 'formplan_custom_foods'

/** Tak för antal sparade varor. Äldsta faller bort först. */
const MAX_ENTRIES = 500

interface StoredFood extends ScannedProduct {
  /** Används för att gallra äldst först när taket nås. */
  saved_at: string
}

function load(): Record<string, StoredFood> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    // En array eller ett primitivt värde här betyder korrupt/främmande data.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as Record<string, StoredFood>
  } catch {
    return {}
  }
}

function save(all: Record<string, StoredFood>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* lagring blockerad eller full — varan loggas ändå, den minns bara inte */
  }
}

/** Normaliserar streckkoden så 0-prefixade varianter inte blir två poster. */
export function normalizeBarcode(code: string): string {
  return code.replace(/\D/g, '').replace(/^0+(?=\d{8})/, '')
}

/** Sparad vara för streckkoden, eller null. */
export function getCustomFood(barcode: string): ScannedProduct | null {
  const code = normalizeBarcode(barcode)
  if (!code) return null
  const hit = load()[code]
  if (!hit) return null
  const { saved_at: _saved, ...product } = hit
  return product
}

/**
 * Sparar en vara. Finns streckkoden redan skrivs den över — användaren har då
 * rättat något hen matat in fel.
 */
export function saveCustomFood(product: ScannedProduct): void {
  const code = normalizeBarcode(product.barcode)
  if (!code) return
  const all = load()
  all[code] = { ...product, barcode: code, saved_at: new Date().toISOString() }

  const codes = Object.keys(all)
  if (codes.length > MAX_ENTRIES) {
    codes
      .sort((a, b) => (all[a]!.saved_at ?? '').localeCompare(all[b]!.saved_at ?? ''))
      .slice(0, codes.length - MAX_ENTRIES)
      .forEach((c) => delete all[c])
  }
  save(all)
}

/** Antal sparade varor — för att kunna visa att listan finns. */
export function countCustomFoods(): number {
  return Object.keys(load()).length
}
