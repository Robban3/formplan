/**
 * Tolkar receptens ingrediensrader till mängd, enhet och livsmedel.
 *
 * AI-recepten ger fritext — "150 g kycklingfilé", "1 msk olivolja", "ca 2–3
 * dl havregryn", "salt och peppar". Inköpslistan däremot summerar mängder per
 * livsmedel. Utan den här översättningen fanns ingen väg mellan dem, och ett
 * genererat recept gick inte att handla efter.
 *
 * TRE REGLER STYR DESIGNEN, och alla tre handlar om att hellre säga "vet inte"
 * än att gissa:
 *
 * 1. Bara EXAKTA enhetsomvandlingar. msk → 15 ml och dl → 100 ml är
 *    definitioner. msk olivolja → gram är en DENSITET, och den skiljer sig
 *    mellan olja, mjöl och socker — den sortens omvandling görs inte här.
 *    Mängder i olika enhetsfamiljer slås därför aldrig ihop; "2 dl mjölk" och
 *    "100 g mjölk" står kvar som två rader. Det är ärligare än ett tal som ser
 *    exakt ut men är fel.
 *
 * 2. Går raden inte att tolka behålls den ORD FÖR ORD, utan mängd. "Salt och
 *    peppar" och "en näve spenat" hamnar i listan som de står. Att tyst släppa
 *    dem vore värst av allt: man upptäcker det först i affären.
 *
 * 3. Intervall tolkas som det ÖVRE talet. "2–3 msk" blir 3. Handlar man för
 *    lite får man gå tillbaka; handlar man för mycket blir det över.
 */

/** Enhetsfamiljer. Mängder slås bara ihop inom samma familj. */
export type UnitFamily = 'mass' | 'volume' | 'count'

export interface ParsedIngredient {
  /** Raden precis som den stod i receptet. */
  raw: string
  /** Livsmedlet, utan mängd och enhet. */
  name: string
  /** Mängd i familjens basenhet (g, ml respektive st), eller null. */
  amount: number | null
  family: UnitFamily | null
}

/**
 * Enheter → basenhet.
 *
 * Alla faktorer här är definitioner, inte uppskattningar: 1 msk = 15 ml och
 * 1 tsk = 5 ml enligt svensk standard, 1 krm = 1 ml.
 */
const UNITS: Record<string, { family: UnitFamily; factor: number }> = {
  // Massa → gram
  g: { family: 'mass', factor: 1 },
  gram: { family: 'mass', factor: 1 },
  hg: { family: 'mass', factor: 100 },
  kg: { family: 'mass', factor: 1000 },
  kilo: { family: 'mass', factor: 1000 },
  // Volym → milliliter
  ml: { family: 'volume', factor: 1 },
  krm: { family: 'volume', factor: 1 },
  kryddmått: { family: 'volume', factor: 1 },
  tsk: { family: 'volume', factor: 5 },
  tesked: { family: 'volume', factor: 5 },
  teskedar: { family: 'volume', factor: 5 },
  msk: { family: 'volume', factor: 15 },
  matsked: { family: 'volume', factor: 15 },
  matskedar: { family: 'volume', factor: 15 },
  cl: { family: 'volume', factor: 10 },
  dl: { family: 'volume', factor: 100 },
  deciliter: { family: 'volume', factor: 100 },
  l: { family: 'volume', factor: 1000 },
  liter: { family: 'volume', factor: 1000 },
  // Antal
  st: { family: 'count', factor: 1 },
  stycken: { family: 'count', factor: 1 },
  styck: { family: 'count', factor: 1 },
}

/** Svenska räkneord. Fler än tio skrivs i praktiken med siffror. */
const NUMBER_WORDS: Record<string, number> = {
  en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5,
  sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10,
  halv: 0.5, halvt: 0.5, en_halv: 0.5,
}

/** Typografiska bråk. */
const FRACTIONS: Record<string, number> = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75, '⅛': 0.125,
}

/**
 * Ord som anger en obestämd mängd.
 *
 * De ger medvetet INGEN siffra. En "näve" är inte ett mått, och att sätta den
 * till t.ex. 30 g vore att hitta på data som ser exakt ut.
 */
const VAGUE = [
  'näve', 'nypa', 'skvätt', 'klick', 'knippe', 'gnutta', 'stänk', 'skopa',
  'efter smak', 'smaka av', 'valfritt',
]

/** Fylls raden med ren krydda/vätska utan mängd är den ändå en inköpspost. */
const APPROX_PREFIX = /^(ca|cirka|ungefär|omkring|drygt|knappt)\.?\s+/i

/**
 * Ord som beskriver hur livsmedlet BEARBETAS, inte vad man köper.
 *
 * "hackad lök" och "lök" är samma vara i affären, så de ska summeras ihop.
 * Ord som ändrar PRODUKTEN står medvetet inte här — "torkad tomat", "fryst
 * spenat" och "rökt lax" är andra varor än sina färska motsvarigheter, och
 * att stryka dem hade slagit ihop saker man inte kan byta mot varandra.
 */
const PREPARATION = [
  'finhackad', 'finhackade', 'grovhackad', 'grovhackade', 'hackad', 'hackade',
  'riven', 'rivet', 'rivna', 'skivad', 'skivade', 'tärnad', 'tärnade',
  'strimlad', 'strimlade', 'pressad', 'pressade', 'mosad', 'mosade',
  'delad', 'delade', 'sköljd', 'sköljda', 'urkärnad', 'urkärnade',
]

/** En mängd i en enhet, i den enhetens basenhet. */
interface Amount {
  amount: number
  family: UnitFamily
}

/** Tolkar ett tal: "1,5", "1/2", "½", "1 1/2", "1½", "två". */
function parseNumber(text: string): number | null {
  const t = text.trim().toLowerCase()
  if (!t) return null

  if (NUMBER_WORDS[t] !== undefined) return NUMBER_WORDS[t]!
  if (FRACTIONS[t] !== undefined) return FRACTIONS[t]!

  // Blandat tal med typografiskt bråk: "1½"
  const mixedTypographic = /^(\d+)\s*([½⅓⅔¼¾⅛])$/.exec(t)
  if (mixedTypographic) {
    return Number(mixedTypographic[1]) + FRACTIONS[mixedTypographic[2]!]!
  }

  // Blandat tal med snedstreck: "1 1/2"
  const mixedSlash = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(t)
  if (mixedSlash) {
    const den = Number(mixedSlash[3])
    if (den === 0) return null
    return Number(mixedSlash[1]) + Number(mixedSlash[2]) / den
  }

  // Rent bråk: "1/2"
  const slash = /^(\d+)\s*\/\s*(\d+)$/.exec(t)
  if (slash) {
    const den = Number(slash[2])
    if (den === 0) return null
    return Number(slash[1]) / den
  }

  // Decimaltal, med komma eller punkt.
  const decimal = /^(\d+(?:[.,]\d+)?)$/.exec(t)
  if (decimal) return Number(decimal[1]!.replace(',', '.'))

  return null
}

/**
 * Hittar "(400 g)" och liknande.
 *
 * En parentes med en vikt vinner över ett förpackningsantal: "1 burk kokta
 * kikärter (400 g)" ska bli 400 g, inte 1 "burk". Det är grammet man handlar
 * efter, och "burk" är ingen enhet som går att summera.
 */
function amountInParentheses(text: string): { amount: Amount; cleaned: string } | null {
  const m = /\(([^)]*)\)/.exec(text)
  if (!m) return null
  const inner = parseAmountPrefix(m[1]!.trim())
  if (!inner || inner.amount.family === 'count') return null
  return { amount: inner.amount, cleaned: text.replace(m[0], ' ').replace(/\s+/g, ' ').trim() }
}

/** Läser en mängd (+ ev. enhet) i början av texten. */
function parseAmountPrefix(text: string): { amount: Amount; rest: string } | null {
  let t = text.trim().replace(APPROX_PREFIX, '')

  // Intervall: "2-3", "2–3", "2 till 3". Övre talet vinner — se regel 3.
  const range = /^(\d+(?:[.,]\d+)?)\s*(?:-|–|—|till)\s*(\d+(?:[.,]\d+)?)\s*(.*)$/i.exec(t)
  if (range) t = `${range[2]} ${range[3]}`

  // Talet: siffror/bråk/räkneord, ev. med typografiskt bråk direkt efter.
  const numMatch =
    /^(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+\s*[½⅓⅔¼¾⅛]|[½⅓⅔¼¾⅛]|\d+(?:[.,]\d+)?)\s*(.*)$/.exec(t) ??
    // (?=\s|$) och inte \b: JavaScripts \b bygger på [A-Za-z0-9_], så å, ä och
    // ö är INTE ordtecken. `två\b` matchade därför aldrig — det finns ingen
    // gräns mellan `å` och mellanslaget. Samma fälla gäller `åtta`.
    /^(en|ett|två|tre|fyra|fem|sex|sju|åtta|nio|tio|halv|halvt)(?=\s|$)\s*(.*)$/i.exec(t)
  if (!numMatch) return null

  const value = parseNumber(numMatch[1]!)
  if (value === null) return null
  let rest = (numMatch[2] ?? '').trim()

  // Enheten, om den står direkt efter talet.
  const unitMatch = /^([a-zåäöA-ZÅÄÖ]+)\.?\b\s*(.*)$/.exec(rest)
  if (unitMatch) {
    const unit = UNITS[unitMatch[1]!.toLowerCase()]
    if (unit) {
      return {
        amount: { amount: value * unit.factor, family: unit.family },
        rest: (unitMatch[2] ?? '').trim(),
      }
    }
  }

  // Tal utan enhet är ett antal: "2 ägg" → 2 st ägg.
  return { amount: { amount: value, family: 'count' }, rest }
}

/** Normaliserar livsmedelsnamnet till en nyckel som kan slås ihop. */
export function ingredientKey(name: string): string {
  let n = name
    .toLowerCase()
    .replace(/[.,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
  // Stryk bearbetningsord var de än står — "lök, finhackad" och "finhackad
  // lök" är samma vara.
  for (const word of PREPARATION) {
    n = n.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ')
  }
  return n.replace(/[\s,]+/g, ' ').trim()
}

/** Tolkar en ingrediensrad. */
export function parseIngredient(raw: string): ParsedIngredient {
  const text = raw.trim()
  const miss: ParsedIngredient = { raw: text, name: text, amount: null, family: null }
  if (!text) return miss

  // Obestämd mängd ⇒ ingen siffra, raden står kvar som den är (regel 2).
  const lower = text.toLowerCase()
  if (VAGUE.some((v) => lower.includes(v))) return miss

  // En vikt i parentes vinner över ett förpackningsantal.
  const paren = amountInParentheses(text)
  if (paren) {
    const withoutAmount = parseAmountPrefix(paren.cleaned)
    const name = (withoutAmount ? withoutAmount.rest : paren.cleaned).trim()
    return {
      raw: text,
      name: name || paren.cleaned,
      amount: paren.amount.amount,
      family: paren.amount.family,
    }
  }

  const parsed = parseAmountPrefix(text)
  if (!parsed || !parsed.rest) return miss

  return { raw: text, name: parsed.rest, amount: parsed.amount.amount, family: parsed.amount.family }
}

/** En hopslagen post: samma livsmedel och samma enhetsfamilj. */
export interface MergedIngredient {
  name: string
  amount: number | null
  family: UnitFamily | null
  /** Raderna posten kommer ur — visas för det som inte gick att tolka. */
  sources: string[]
}

/**
 * Slår ihop ingredienser per livsmedel OCH enhetsfamilj.
 *
 * Familjen ingår i nyckeln med avsikt: "2 dl mjölk" och "100 g mjölk" blir två
 * rader, eftersom att slå ihop dem skulle kräva en densitet (se regel 1).
 * Otolkade rader slås aldrig ihop — de kan betyda olika saker.
 */
export function mergeIngredients(items: ParsedIngredient[]): MergedIngredient[] {
  const merged = new Map<string, MergedIngredient>()
  const unparsed: MergedIngredient[] = []

  for (const item of items) {
    if (item.amount === null || item.family === null) {
      unparsed.push({ name: item.raw, amount: null, family: null, sources: [item.raw] })
      continue
    }
    const key = `${ingredientKey(item.name)}|${item.family}`
    const existing = merged.get(key)
    if (existing) {
      existing.amount = (existing.amount ?? 0) + item.amount
      existing.sources.push(item.raw)
    } else {
      merged.set(key, {
        name: item.name,
        amount: item.amount,
        family: item.family,
        sources: [item.raw],
      })
    }
  }

  return [...merged.values(), ...unparsed]
}

/**
 * Mängden som text, i den största enhet som ger ett läsbart tal.
 *
 * Volym visas i dl när det går jämnt ut — ett recept säger "3 dl", inte
 * "300 ml".
 */
export function formatIngredientAmount(
  amount: number | null,
  family: UnitFamily | null,
  locale = 'sv'
): string {
  if (amount === null || family === null) return ''
  const n = (v: number, max = 1) => v.toLocaleString(locale, { maximumFractionDigits: max })

  if (family === 'mass') {
    return amount >= 1000 ? `${n(amount / 1000)} kg` : `${n(Math.round(amount), 0)} g`
  }
  if (family === 'volume') {
    if (amount >= 1000) return `${n(amount / 1000)} l`
    if (amount >= 100 && amount % 100 === 0) return `${n(amount / 100)} dl`
    if (amount >= 15 && amount % 15 === 0) return `${n(amount / 15)} msk`
    if (amount >= 5 && amount % 5 === 0) return `${n(amount / 5)} tsk`
    return `${n(amount)} ml`
  }
  return `${n(amount)} st`
}
