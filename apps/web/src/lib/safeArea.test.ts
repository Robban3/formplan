import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Safe-area i toppen av appen.
 *
 * I Capacitor på iOS ligger WebViewen UNDER statusraden — appen sätter
 * `viewport-fit=cover`, så `env(safe-area-inset-top)` ger notchens höjd och
 * måste räknas in. Utan det hamnar rubriker och knappar under statusraden
 * eller Dynamic Island.
 *
 * Buggarna testet kommer ur: en sticky header på `top-0` med bara `py-3`
 * (integritetspolicyn — sidan App Store-granskaren öppnar utan konto), en
 * bakåtknapp på `absolute top-12` ovanpå en hero-bild, och helsidestillstånd
 * med `pt-12`, som är exakt `pt-header` minus insetet.
 *
 * Tailwinds `top-*` och `pt-*` kan inte räkna in `env()`, så de fallen behöver
 * klasserna i index.css: `pt-header`, `safe-top`, `safe-pt`, `safe-pin-top`.
 *
 * Testet kontrollerar PLACERING i toppen, inte att varje sida ser rätt ut:
 * en helt ny sida utan topp-padding fångas inte. Det kräver en riktig enhet.
 */

const SRC = fileURLToPath(new URL('..', import.meta.url))

/** Klasserna som räknar in env(safe-area-inset-top). */
const SAFE = /\b(pt-header|safe-top|safe-pt|safe-pin-top)\b/

/** Varje className-sträng i filen, med radnummer. */
function classNames(file: string): { line: number; value: string }[] {
  const out: { line: number; value: string }[] = []
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const m of line.matchAll(/className="([^"]*)"/g)) {
        out.push({ line: i + 1, value: m[1]! })
      }
    })
  return out
}

function tsxFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full))
    else if (entry.endsWith('.tsx')) out.push(full)
  }
  return out
}

const ALL = tsxFiles(SRC).flatMap((file) =>
  classNames(file).map((c) => ({ ...c, rel: file.slice(SRC.length) }))
)

describe('safe-area i toppen', () => {
  it('hittar className-strängar att granska', () => {
    // Utan det här skulle reglerna nedan passera av fel anledning.
    expect(ALL.length).toBeGreaterThan(100)
  })

  /**
   * Ett element som ligger fast mot toppen täcker statusraden. Dess bakgrund
   * ska gå under notchen, men innehållet måste padda ner — annars ligger
   * knapparna under den.
   *
   * Klassen får sitta på elementet självt ELLER på innehållet strax inuti:
   * ligger bakgrunden på det sticky elementet och paddingen på barnet blir
   * resultatet samma — bakgrunden täcker insetet, innehållet trycks ner. Därför
   * en närhetskoll på de följande raderna i stället för ett krav på elementet.
   */
  it('sticky/fixed top-0 räknar in insetet', () => {
    const NEARBY = 3
    const bad = ALL.filter((c) => {
      if (!/\b(sticky|fixed)\b/.test(c.value) || !/\btop-0\b/.test(c.value)) return false
      const near = ALL.filter(
        (o) => o.rel === c.rel && o.line >= c.line && o.line <= c.line + NEARBY
      )
      return !near.some((o) => SAFE.test(o.value))
    }).map((c) => `${c.rel}:${c.line}  ${c.value}`)
    expect(bad, 'lägg till safe-top (eller pt-header) på elementet eller dess innehåll').toEqual([])
  })

  /**
   * Ett hårdkodat top-offset är ett försök att komma undan statusraden som inte
   * vet hur hög den är: `top-12` är 3rem, och insetet på en notchad iPhone är
   * ungefär lika mycket — knappen hamnade mitt i Dynamic Island.
   */
  it('inget hårdkodat top-offset på placerade element', () => {
    const bad = ALL.filter(
      (c) =>
        /\b(absolute|fixed|sticky)\b/.test(c.value) &&
        /\btop-([4-9]|[1-9][0-9])\b/.test(c.value) &&
        !SAFE.test(c.value)
    ).map((c) => `${c.rel}:${c.line}  ${c.value}`)
    expect(bad, 'använd safe-pin-top i stället för top-<n>').toEqual([])
  })

  /**
   * `pt-12` är precis `pt-header` utan insetet — det var värdet pt-header
   * ersatte. Som topp-padding på en hel sida (px-5 i samma className är
   * signaturen) är det alltid fel. Inne i en sida som redan har pt-header är
   * pt-12 däremot bara avstånd till en spinner, och det är i sin ordning.
   */
  it('ingen sidrot använder pt-12 i stället för pt-header', () => {
    const bad = ALL.filter(
      (c) => /\bpt-1[02]\b/.test(c.value) && /\bpx-5\b/.test(c.value) && !SAFE.test(c.value)
    ).map((c) => `${c.rel}:${c.line}  ${c.value}`)
    expect(bad, 'byt pt-12 mot pt-header').toEqual([])
  })
})
