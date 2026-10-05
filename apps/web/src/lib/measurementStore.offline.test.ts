import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Offline-flushen för kroppsmått.
 *
 * Samma bugg som weightStore hade — `.catch(() => {})` utan återförsökskö, så
 * mått loggade utan nät fanns bara i den här webbläsarens localStorage. Testet
 * är kortare än weightStore.offline.test.ts med avsikt: lagren delar kön i
 * pendingSync.ts, och den täcks där. Här kontrolleras att MÅTTENS väg genom
 * den fungerar — omkretsfälten följer med, vilket vikten inte har.
 */

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
let uuidCounter = 0
vi.stubGlobal('crypto', { randomUUID: () => `uuid-${++uuidCounter}` })

const server = { create: vi.fn(), list: vi.fn(), remove: vi.fn() }

vi.mock('./measurementsApi', () => ({
  measurementsApi: {
    create: (...a: unknown[]) => server.create(...a),
    list: (...a: unknown[]) => server.list(...a),
    remove: (...a: unknown[]) => server.remove(...a),
  },
}))

const { addMeasurement, getMeasurements, flushLocalMeasurements } = await import(
  './measurementStore'
)

const settle = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  storage.clear()
  uuidCounter = 0
  server.create.mockReset()
  server.list.mockReset()
  server.remove.mockReset()
})

describe('mått loggade offline går inte förlorade', () => {
  it('posten ligger kvar som väntande när servern inte svarar', async () => {
    server.create.mockRejectedValue(new Error('offline'))
    addMeasurement({ date: '2026-10-05', waist_cm: 82, chest_cm: 101 })
    await settle()

    const all = getMeasurements()
    expect(all).toHaveLength(1)
    expect(all[0]!.id.startsWith('local-')).toBe(true)
  })

  it('flushen skickar omkretsfälten och client_id', async () => {
    server.create.mockRejectedValue(new Error('offline'))
    const entry = addMeasurement({ date: '2026-10-05', waist_cm: 82, thigh_cm: 58 })
    await settle()

    server.create.mockReset()
    server.create.mockResolvedValue({ measurement: { id: 'server-1' } })
    await flushLocalMeasurements()

    expect(server.create).toHaveBeenCalledWith({
      measured_on: '2026-10-05',
      waist_cm: 82,
      thigh_cm: 58,
      client_id: entry.id,
    })
    expect(getMeasurements()[0]!.id).toBe('server-1')
  })

  it('en andra flush skickar inget igen', async () => {
    server.create.mockResolvedValue({ measurement: { id: 'server-2' } })
    addMeasurement({ date: '2026-10-05', waist_cm: 82 })
    await settle()

    server.create.mockReset()
    await flushLocalMeasurements()
    expect(server.create).not.toHaveBeenCalled()
  })
})
