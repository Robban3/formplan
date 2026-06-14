export interface ScannedProduct {
  barcode: string
  name: string
  brand: string | null
  kcal_per_100g: number
  protein_per_100g: number
  fat_per_100g: number
  carbs_per_100g: number
  serving_size_g: number | null
}

interface OffNutriments {
  'energy-kcal_100g'?: number
  energy_100g?: number
  proteins_100g?: number
  fat_100g?: number
  carbohydrates_100g?: number
}

interface OffResponse {
  status?: number
  product?: {
    product_name?: string
    brands?: string
    nutriments?: OffNutriments
    serving_quantity?: number | string
  }
}

const r1 = (n: number) => Math.round(n * 10) / 10

export interface OffFoodResult {
  id: string // `off-<code>` — sentinel so callers log it with food_id = null
  name: string
  kcal_per_100g: number
  protein_per_100g: number
  fat_per_100g: number
  carbs_per_100g: number
  serving_size_g?: number
}

interface OffSearchProduct {
  code?: string
  product_name?: string
  brands?: string
  nutriments?: OffNutriments
  serving_quantity?: number | string
}

/** True for items that came from Open Food Facts (not the local food_item table). */
export function isOffId(id: string): boolean {
  return id.startsWith('off-')
}

/**
 * Free-text search against Open Food Facts (millions of products). Runs in the
 * browser. Skips products without a name or any usable nutrition data.
 */
export async function searchOpenFoodFacts(q: string, limit = 20): Promise<OffFoodResult[]> {
  const term = q.trim()
  if (term.length < 2) return []

  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}` +
    `&search_simple=1&action=process&json=1&page_size=${limit}` +
    `&fields=code,product_name,brands,nutriments,serving_quantity`

  let products: OffSearchProduct[]
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = (await res.json()) as { products?: OffSearchProduct[] }
    products = data.products ?? []
  } catch {
    return []
  }

  const out: OffFoodResult[] = []
  const seen = new Set<string>()
  for (const p of products) {
    const baseName = p.product_name?.trim()
    if (!baseName) continue
    const n = p.nutriments ?? {}
    const kcal = n['energy-kcal_100g'] ?? (n.energy_100g ? n.energy_100g / 4.184 : 0)
    const protein = n.proteins_100g ?? 0
    const fat = n.fat_100g ?? 0
    const carbs = n.carbohydrates_100g ?? 0
    if (kcal <= 0 && protein <= 0 && fat <= 0 && carbs <= 0) continue

    const brand = p.brands?.split(',')[0]?.trim()
    const name = brand ? `${baseName} (${brand})` : baseName
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    out.push({
      id: `off-${p.code ?? key}`,
      name,
      kcal_per_100g: Math.round(kcal),
      protein_per_100g: r1(protein),
      fat_per_100g: r1(fat),
      carbs_per_100g: r1(carbs),
      ...(typeof p.serving_quantity === 'number' ? { serving_size_g: p.serving_quantity } : {}),
    })
  }
  return out
}

/**
 * Look up a product by barcode in the free Open Food Facts database.
 * Runs in the user's browser at runtime. Returns null when not found or when
 * the product lacks usable nutrition data.
 */
export async function lookupBarcode(code: string): Promise<ScannedProduct | null> {
  const clean = code.trim()
  if (!clean) return null

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json?fields=product_name,brands,nutriments,serving_quantity`
  let data: OffResponse
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    data = (await res.json()) as OffResponse
  } catch {
    return null
  }

  const p = data.product
  if (!p) return null

  const n = p.nutriments ?? {}
  const kcal = n['energy-kcal_100g'] ?? (n.energy_100g ? n.energy_100g / 4.184 : 0)
  const protein = n.proteins_100g ?? 0
  const fat = n.fat_100g ?? 0
  const carbs = n.carbohydrates_100g ?? 0

  // No usable nutrition data → treat as not found rather than logging zeros.
  if (kcal <= 0 && protein <= 0 && fat <= 0 && carbs <= 0) return null

  const serving =
    typeof p.serving_quantity === 'number'
      ? p.serving_quantity
      : p.serving_quantity
        ? Number(p.serving_quantity) || null
        : null

  return {
    barcode: clean,
    name: p.product_name?.trim() || 'Okänd produkt',
    brand: p.brands?.split(',')[0]?.trim() || null,
    kcal_per_100g: Math.round(kcal),
    protein_per_100g: r1(protein),
    fat_per_100g: r1(fat),
    carbs_per_100g: r1(carbs),
    serving_size_g: serving,
  }
}
