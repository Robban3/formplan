// In-memory KVNamespace-stubb för tester.
//
// KV-vägarna (rate limiting, premium-cachen, cron-dedupmarkörerna) kördes
// tidigare aldrig i testerna eftersom testmiljön saknar RATE_LIMIT_KV — allt
// föll tillbaka på in-memory-varianterna. Stubben härmar de delar av KV som
// koden faktiskt använder, inklusive de beteenden som gör skillnad:
//
//  * expirationTtl < 60 s AVVISAS (precis som riktiga KV) — annars kunde en
//    put som kastar mitt i en middleware aldrig fångas av ett test,
//  * utgångna nycklar läses som null,
//  * getWithMetadata returnerar { value, metadata } som produktionskoden läser.
//
// Klockan: stubben läser Date.now() direkt, så den följer vi.setSystemTime().
// `advance(ms)` flyttar BARA stubbens egen klocka och desynkar den därför från
// koden under test — ett test som flyttade den 41 dygn framåt lät markören löpa
// ut medan jobbet fortfarande räknade användaren som 5 dygn gammal, ett läge som
// inte kan uppstå i produktion. Använd vi.useFakeTimers()/setSystemTime när både
// koden och TTL:erna ska följa med; `advance` finns kvar för rena TTL-tester.

interface MockEntry {
  value: string
  metadata: unknown
  expiresAt: number | null
}

export interface MockKV {
  /** KVNamespace att stoppa in i Env. */
  kv: KVNamespace
  /** Rådata — för att inspektera eller plantera värden (även trasiga). */
  store: Map<string, MockEntry>
  /** Sätt ett värde utan TTL-validering (t.ex. korrupt data). */
  seed(key: string, value: string): void
  /** Flytta stubbens klocka framåt så TTL:er löper ut. */
  advance(ms: number): void
  /** Antal lyckade put-anrop (premium-cachen ska inte skriva i onödan). */
  puts: number
}

export function createMockKV(): MockKV {
  const store = new Map<string, MockEntry>()
  let offset = 0
  const now = () => Date.now() + offset

  const live = (key: string): MockEntry | undefined => {
    const entry = store.get(key)
    if (!entry) return undefined
    if (entry.expiresAt != null && entry.expiresAt <= now()) {
      store.delete(key)
      return undefined
    }
    return entry
  }

  const mock: MockKV = {
    kv: undefined as unknown as KVNamespace,
    store,
    seed(key: string, value: string) {
      store.set(key, { value, metadata: null, expiresAt: null })
    },
    advance(ms: number) {
      offset += ms
    },
    puts: 0,
  }

  const kv = {
    async get(key: string): Promise<string | null> {
      return live(key)?.value ?? null
    },
    async getWithMetadata(key: string): Promise<{ value: string | null; metadata: unknown }> {
      const entry = live(key)
      return { value: entry?.value ?? null, metadata: entry?.metadata ?? null }
    },
    async put(
      key: string,
      value: string,
      options?: { expirationTtl?: number; expiration?: number; metadata?: unknown }
    ): Promise<void> {
      const ttl = options?.expirationTtl
      if (ttl != null && ttl < 60) {
        // Samma fel som Cloudflare KV ger — får INTE tystas ned i tester.
        throw new Error(
          `KV PUT failed: 400 Invalid expiration_ttl of ${ttl}. Expiration TTL must be at least 60.`
        )
      }
      store.set(key, {
        value: String(value),
        metadata: options?.metadata ?? null,
        expiresAt: ttl != null ? now() + ttl * 1000 : null,
      })
      mock.puts++
    },
    async delete(key: string): Promise<void> {
      store.delete(key)
    },
    async list(options?: { prefix?: string }): Promise<{
      keys: { name: string; expiration?: number }[]
      list_complete: boolean
      cursor?: string
    }> {
      // Går via live() så utgångna nycklar inte listas, och respekterar prefix —
      // annars beskriver stubben ett KV som inte finns.
      const prefix = options?.prefix ?? ''
      const keys = [...store.keys()]
        .filter((name) => name.startsWith(prefix))
        .filter((name) => live(name) !== undefined)
        .map((name) => {
          const entry = store.get(name)!
          return entry.expiresAt != null
            ? { name, expiration: Math.floor(entry.expiresAt / 1000) }
            : { name }
        })
      return { keys, list_complete: true }
    },
  }

  mock.kv = kv as unknown as KVNamespace
  return mock
}
