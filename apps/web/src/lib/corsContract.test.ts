import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * Kontraktet mellan webbens HTTP-klient och API:ts CORS.
 *
 * Buggen testet kommer ur: webben började skicka X-FormPlan-Language på varje
 * anrop när appen blev tvåspråkig, men headern lades aldrig till i API:ts
 * allowHeaders. En header som saknas där får webbläsaren att avvisa HELA
 * preflighten — alltså fallerade varenda förfrågan från app.formplan.app, inte
 * bara de språkberoende. Webbappen var nere i fyra dygn.
 *
 * Varför ingenting fångade det:
 *
 *  - API:ts egna tester anropar app.request() direkt och går aldrig genom en
 *    preflight. De kunde per definition inte se det.
 *  - Native-appen gick fri: CapacitorHttp gör anropen i native-lagret, utanför
 *    webbläsarens CORS. TestFlight-bygget fungerade alltså hela tiden medan
 *    webben låg nere — trasigt på exakt den yta ingen tittade på.
 *
 * Preflighten testas nu på riktigt i apps/api (OPTIONS mot en route). DET HÄR
 * testet tar den andra halvan: att de två filerna är ÖVERENS. Lägger någon en
 * header i klienten utan att röra CORS fälls bygget här, oavsett om någon
 * kommit ihåg att utöka preflight-testerna.
 *
 * Läser API-filen som TEXT av samma skäl som equipment.sync.test.ts: en import
 * över paketgränsen skulle ligga utanför webbens tsconfig-rot.
 */

const CLIENT = new URL('./api.ts', import.meta.url)
const API_INDEX = new URL('../../../api/src/index.ts', import.meta.url)

/** Headernamnen klienten sätter i authHeaders(). */
function headersSentByClient(): string[] {
  const src = readFileSync(CLIENT, 'utf8')
  const start = src.indexOf('async function authHeaders')
  expect(start, 'authHeaders() hittades inte i api.ts').toBeGreaterThan(-1)
  const body = src.slice(start, src.indexOf('\n}', start))

  const names = [...body.matchAll(/^\s*'([A-Za-z][A-Za-z0-9-]*)':/gm)].map((m) => m[1]!)
  // Authorization sätts villkorat och matchar inte mönstret ovan.
  if (/Authorization:/.test(body)) names.push('Authorization')
  return names
}

/** Headernamnen API:ts cors() släpper igenom. */
function headersAllowedByApi(): string[] {
  const src = readFileSync(API_INDEX, 'utf8')
  const m = /allowHeaders:\s*\[([^\]]*)\]/.exec(src)
  expect(m, 'allowHeaders hittades inte i apps/api/src/index.ts').not.toBeNull()

  const out: string[] = []
  for (const raw of m![1]!.split(',')) {
    const token = raw.trim()
    if (!token) continue
    const literal = /^'([^']+)'$/.exec(token)
    if (literal) {
      out.push(literal[1]!)
      continue
    }
    // En konstant, t.ex. LANG_HEADER — slå upp dess värde i lib/lang.ts.
    if (token === 'LANG_HEADER') {
      const lang = readFileSync(new URL('../../../api/src/lib/lang.ts', import.meta.url), 'utf8')
      const v = /LANG_HEADER\s*=\s*'([^']+)'/.exec(lang)
      expect(v, 'LANG_HEADER saknar värde i lib/lang.ts').not.toBeNull()
      out.push(v![1]!)
      continue
    }
    throw new Error(`Okänt uttryck i allowHeaders: ${token}. Utöka testet.`)
  }
  return out
}

describe('webbens headrar är tillåtna av API:ts CORS', () => {
  it('hittar headrar att jämföra', () => {
    // Utan det här skulle testet passera av fel anledning om en parsning gick
    // sönder — tom lista mot tom lista är alltid "överens".
    expect(headersSentByClient().length).toBeGreaterThanOrEqual(3)
    expect(headersAllowedByApi().length).toBeGreaterThanOrEqual(3)
  })

  it('varje header klienten skickar finns i allowHeaders', () => {
    // Headernamn är skiftlägesokänsliga i HTTP; klienten skriver
    // X-FormPlan-Language, API:t x-formplan-language.
    const allowed = headersAllowedByApi().map((h) => h.toLowerCase())
    const missing = headersSentByClient().filter((h) => !allowed.includes(h.toLowerCase()))
    expect(
      missing,
      'lägg till headern i allowHeaders i apps/api/src/index.ts — annars avvisar webbläsaren HELA preflighten och varje anrop från webben fallerar'
    ).toEqual([])
  })

  it('språkheadern specifikt, eftersom det var den som fällde appen', () => {
    expect(headersAllowedByApi().map((h) => h.toLowerCase())).toContain('x-formplan-language')
  })
})
