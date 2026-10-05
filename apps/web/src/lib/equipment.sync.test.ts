import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { EQUIPMENT_FOR_PROFILE } from './equipment'

/**
 * Håller utrustningskartan identisk mellan apparna.
 *
 * apps/api/src/lib/equipment.ts filtrerar övningskatalogen innan AI-prompten;
 * apps/web/src/lib/equipment.ts markerar vilka färdiga program användaren kan
 * göra. Glider de isär visar appen ett program som genomförbart medan
 * schemagenereringen räknar samma utrustning som otillgänglig — en bugg som
 * ingen av filerna ser själv.
 *
 * Apparna delar inget paket. Alternativen var att generera filen (policy i en
 * datagenerator) eller att jämföra dem i ett test. Det här är det billigare.
 *
 * Läser API-filen som TEXT, inte via import: en import över paketgränsen
 * skulle ligga utanför webbens tsconfig-rot.
 */
describe('utrustningskartan är synkad mellan app och API', () => {
  const apiSource = readFileSync(
    new URL('../../../api/src/lib/equipment.ts', import.meta.url),
    'utf8'
  )

  /** Plockar ut `export const <namn> = { … }` ur källkoden som ett objekt. */
  function parseMap(source: string, name: string): Record<string, string[]> {
    const start = source.indexOf(`export const ${name}`)
    expect(start, `${name} hittades inte i API-filen`).toBeGreaterThan(-1)
    const open = source.indexOf('{', start)
    const close = source.indexOf('\n}', open)
    const body = source.slice(open + 1, close)
    const out: Record<string, string[]> = {}
    for (const line of body.split('\n')) {
      const m = /^\s*'([^']+)':\s*\[([^\]]*)\],/.exec(line)
      if (!m) continue
      out[m[1]!] = m[2]!
        .split(',')
        .map((v) => v.trim().replace(/^'|'$/g, ''))
        .filter(Boolean)
    }
    return out
  }

  it('samma nycklar och värden', () => {
    const fromApi = parseMap(apiSource, 'EQUIPMENT_FOR_PROFILE')
    expect(Object.keys(fromApi).sort()).toEqual(Object.keys(EQUIPMENT_FOR_PROFILE).sort())
    for (const [choice, values] of Object.entries(fromApi)) {
      expect(values.sort(), choice).toEqual([...EQUIPMENT_FOR_PROFILE[choice]!].sort())
    }
  })

  it('kartan är inte tom — en trasig parsning ska inte passera tyst', () => {
    const fromApi = parseMap(apiSource, 'EQUIPMENT_FOR_PROFILE')
    expect(Object.keys(fromApi).length).toBeGreaterThanOrEqual(7)
  })
})
