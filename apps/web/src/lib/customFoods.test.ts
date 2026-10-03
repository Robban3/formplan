import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

const storage = makeStorage()
vi.stubGlobal('localStorage', storage)

const { getCustomFood, saveCustomFood, countCustomFoods, normalizeBarcode } = await import(
  './customFoods'
)

const KEY = 'formplan_custom_foods'

const kottbullar = {
  barcode: '7310865004703',
  name: 'Köttbullar',
  brand: 'Testmärket',
  kcal_per_100g: 210,
  protein_per_100g: 14,
  fat_per_100g: 15,
  carbs_per_100g: 5,
  serving_size_g: null,
}

beforeEach(() => storage.clear())

describe('egna varor', () => {
  it('sparar och hittar tillbaka på streckkoden', () => {
    saveCustomFood(kottbullar)
    expect(getCustomFood('7310865004703')).toEqual(kottbullar)
  })

  it('returnerar null för en okänd kod', () => {
    expect(getCustomFood('1234567890123')).toBeNull()
  })

  // Samma vara skannad två gånger kan ge en 0-prefixad variant (UPC-A läst som
  // EAN-13). Utan normalisering blev det två poster och den sparade hittades inte.
  it('behandlar nollprefixade varianter som samma kod', () => {
    saveCustomFood({ ...kottbullar, barcode: '0012345678905' })
    expect(getCustomFood('12345678905')?.name).toBe('Köttbullar')
    expect(normalizeBarcode('0012345678905')).toBe('12345678905')
  })

  it('skriver över när användaren rättar en felinmatning', () => {
    saveCustomFood(kottbullar)
    saveCustomFood({ ...kottbullar, kcal_per_100g: 195 })
    expect(getCustomFood(kottbullar.barcode)?.kcal_per_100g).toBe(195)
    expect(countCustomFoods()).toBe(1)
  })

  it('ignorerar en tom eller icke-numerisk streckkod', () => {
    saveCustomFood({ ...kottbullar, barcode: '' })
    saveCustomFood({ ...kottbullar, barcode: 'abc' })
    expect(countCustomFoods()).toBe(0)
    expect(getCustomFood('')).toBeNull()
  })

  // Korrupt eller främmande data i nyckeln får inte krascha kostdagboken.
  it('behandlar trasig lagring som tomt', () => {
    storage.setItem(KEY, 'inte json')
    expect(getCustomFood(kottbullar.barcode)).toBeNull()
    storage.setItem(KEY, '["en array"]')
    expect(countCustomFoods()).toBe(0)
  })

  it('sparar inte saved_at vidare till produkten', () => {
    saveCustomFood(kottbullar)
    expect(getCustomFood(kottbullar.barcode)).not.toHaveProperty('saved_at')
  })
})
