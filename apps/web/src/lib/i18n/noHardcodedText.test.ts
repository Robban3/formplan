import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Letar efter synlig text som inte gått genom översättningen.
 *
 * Varför testet finns: den tvåspråkiga genomgången missade 67 strängar i 31
 * filer — rubriker och knappetiketter låg kvar på svenska direkt intill
 * `{t(...)}`-anrop. Att det var ordboken som var typad räckte inte: tsc
 * fäller en SAKNAD översättning, men ser inte en sträng som aldrig slogs upp.
 * Sådant syns bara när någon byter språk, och ingen gjorde det.
 *
 * Testet läser JSX-textnoder, inte alla stränglitteraler. Det missar text i
 * attribut (`placeholder`, `aria-label`) och är alltså ingen fullständig
 * granskning — men det fångar den form felen faktiskt tog.
 */

const SRC = fileURLToPath(new URL('../..', import.meta.url))

/** Rader som inte är JSX-text: importlistor, kommentarer. */
const NOT_JSX_TEXT = /^\s*(\w+,|import\b|export\b|\/\/|\/\*|\*)/

/**
 * `Nyckel: värde` — objektegenskap eller omdöpt destrukturering, aldrig en
 * textnod. Måste tillåta å/ä/ö i nyckeln: `\w` i JavaScript är bara ASCII,
 * så ett filter byggt på `\w+` släppte igenom `Lätt:` och `Mellanmål:`.
 */
const PROPERTY = /^[\p{L}\w$]+\s*:\s*\S/u

/**
 * `>Text<` på en rad, eller en rad som bara innehåller text mellan taggar.
 * Rader med `{` hoppas över — där ligger uttrycket, inte en litteral.
 */
const INLINE = />\s*([A-ZÅÄÖ][A-Za-zÅÄÖåäö0-9 ,.'’:%/–-]{2,})\s*</g
const STANDALONE = /^[A-ZÅÄÖ][A-Za-zÅÄÖåäö0-9 ,.'’:%/–-]{2,}$/

/**
 * Text som får stå kvar oöversatt.
 *
 * Bara egennamn och sådant som är identiskt i båda språken. Växer den här
 * listan är det nästan alltid fel svar — lägg in en nyckel i stället.
 */
const ALLOWED = new Set(['FormPlan', 'Version 0.1.0'])

function tsxFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full))
    else if (entry.endsWith('.tsx')) out.push(full)
  }
  return out
}

describe('ingen hårdkodad text i gränssnittet', () => {
  it('varje JSX-textnod går genom t()', () => {
    const found: string[] = []
    for (const file of tsxFiles(SRC)) {
      const rel = file.slice(SRC.length)
      const lines = readFileSync(file, 'utf8').split('\n')
      // En flerradig {/* … */}-kommentar vars mittenrader inte börjar med `*`
      // ser annars ut som text. Hela blocket måste hoppas över.
      let inComment = false
      lines.forEach((line, i) => {
        const opens = line.lastIndexOf('/*')
        const closes = line.lastIndexOf('*/')
        const wasInComment = inComment
        if (opens > closes) inComment = true
        else if (closes > opens) inComment = false
        if (wasInComment || inComment) return
        if (NOT_JSX_TEXT.test(line) || line.includes('{')) return
        for (const m of line.matchAll(INLINE)) {
          const text = m[1]!.trim()
          if (!ALLOWED.has(text)) found.push(`${rel}:${i + 1}  ${text}`)
        }
        const bare = line.trim()
        if (PROPERTY.test(bare)) return
        if (STANDALONE.test(bare) && !ALLOWED.has(bare)) found.push(`${rel}:${i + 1}  ${bare}`)
      })
    }
    expect(found, 'text utan t() — lägg en nyckel i sv.ts och en.ts').toEqual([])
  })
})
