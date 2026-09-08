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
// Använd `__advance(ms)` för att låta TTL:er löpa ut utan att vänta i realtid.

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
    async list(): Promise<{ keys: { name: string }[]; list_complete: boolean }> {
      return { keys: [...store.keys()].map((name) => ({ name })), list_complete: true }
    },
  }

  mock.kv = kv as unknown as KVNamespace
  return mock
}
