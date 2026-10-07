import { describe, it, expect } from 'vitest'
import { withRecipeIngredients, type ShoppingCategory } from './shoppingList'
import { parseIngredient } from './recipeIngredients'

/**
 * Receptens ingredienser in i inköpslistan.
 *
 * Buggen det löser: ett genererat recept gick inte att handla efter. Recept
 * och inköpslista var två system utan väg emellan — listan byggdes ur
 * veckoschemat, receptens ingredienser fanns bara på skärmen.
 */
const parse = (rows: string[]) => rows.map(parseIngredient)

const EMPTY: ShoppingCategory[] = []

describe('withRecipeIngredients', () => {
  it('utan recept ändras ingenting', () => {
    const base: ShoppingCategory[] = [
      { category: 'Frukt & grönt', items: [{ name: 'Banan', amount: 100, family: 'mass' }] },
    ]
    expect(withRecipeIngredients(base, [])).toBe(base)
  })

  it('ingredienserna hamnar i rätt varukategori', () => {
    const out = withRecipeIngredients(EMPTY, parse(['150 g kycklingfilé', '100 g broccoli']))
    const cat = (n: string) => out.find((c) => c.category === n)
    expect(cat('Kött, fisk & ägg')!.items[0]!.name).toBe('kycklingfilé')
    expect(cat('Frukt & grönt')!.items[0]!.name).toBe('broccoli')
  })

  it('okänt livsmedel hamnar i Övrigt i stället för att försvinna', () => {
    const out = withRecipeIngredients(EMPTY, parse(['2 msk fisksås']))
    expect(out.find((c) => c.category === 'Övrigt')!.items[0]!.name).toBe('fisksås')
  })

  it('enheten överlever hela vägen', () => {
    const out = withRecipeIngredients(EMPTY, parse(['2 dl havregryn']))
    const item = out.flatMap((c) => c.items).find((i) => i.name === 'havregryn')!
    expect(item).toEqual({ name: 'havregryn', amount: 200, family: 'volume' })
  })

  it('två recept med samma vara ger en rad', () => {
    const out = withRecipeIngredients(EMPTY, parse(['150 g kyckling', '200 g kyckling']))
    const items = out.flatMap((c) => c.items).filter((i) => i.name.includes('kyckling'))
    expect(items).toHaveLength(1)
    expect(items[0]!.amount).toBe(350)
  })

  /**
   * Veckoschemats mängder kommer ur en kurerad livsmedelslista, receptens ur
   * fritext. De summeras bara när namn OCH enhetsfamilj är lika — annars hade
   * en stavningsvariant sett ut som en dubbel mängd.
   */
  it('summerar med veckoschemats rad när namnet stämmer', () => {
    const base: ShoppingCategory[] = [
      { category: 'Kött, fisk & ägg', items: [{ name: 'Kycklingbröst', amount: 300, family: 'mass' }] },
    ]
    const out = withRecipeIngredients(base, parse(['150 g kycklingbröst']))
    const items = out.find((c) => c.category === 'Kött, fisk & ägg')!.items
    expect(items).toHaveLength(1)
    expect(items[0]!.amount).toBe(450)
  })

  it('summerar INTE över enhetsfamiljer', () => {
    const base: ShoppingCategory[] = [
      { category: 'Mejeri & protein', items: [{ name: 'mjölk', amount: 200, family: 'mass' }] },
    ]
    const out = withRecipeIngredients(base, parse(['2 dl mjölk']))
    expect(out.find((c) => c.category === 'Mejeri & protein')!.items).toHaveLength(2)
  })

  it('en rad utan mängd slås inte ihop med en som har mängd', () => {
    const base: ShoppingCategory[] = [
      { category: 'Övrigt', items: [{ name: 'salt', amount: 50, family: 'mass' }] },
    ]
    const out = withRecipeIngredients(base, parse(['salt och peppar']))
    expect(out.find((c) => c.category === 'Övrigt')!.items).toHaveLength(2)
  })

  it('ingen ingrediens försvinner', () => {
    const rows = ['150 g kycklingfilé', '1 msk olivolja', 'salt och peppar', 'en näve persilja']
    const out = withRecipeIngredients(EMPTY, parse(rows))
    expect(out.flatMap((c) => c.items)).toHaveLength(rows.length)
  })

  it('kategorierna behåller sin ordning', () => {
    const out = withRecipeIngredients(EMPTY, parse(['2 msk fisksås', '100 g broccoli', '150 g lax']))
    expect(out.map((c) => c.category)).toEqual(['Frukt & grönt', 'Kött, fisk & ägg', 'Övrigt'])
  })
})
