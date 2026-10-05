import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Offline-flushen för vikt.
 *
 * Buggen: addWeightEntry speglade till servern med
 * `measurementsApi.create(...).catch(() => {})` och gav upp vid fel. Till
 * skillnad från vattenloggen och träningspassen fanns ingen återförsökskö, så
 * en vikt loggad utan nät låg kvar i den här webbläsarens localStorage för
 * alltid — borta vid enhetsbyte eller ominstallation. Borttagningar hade samma
 * problem i andra riktningen: raden låg kvar på servern och kom tillbaka.
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
vi.stubGlobal('crypto', { randomUUID: () => `uuid-${++uuidCounter}` })
let uuidCounter = 0

/** Serversvar vi styr per test. */
const server = {
  create: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
}

vi.mock('./measurementsApi', () => ({
  measurementsApi: {
    create: (...a: unknown[]) => server.create(...a),
    list: (...a: unknown[]) => server.list(...a),
    remove: (...a: unknown[]) => server.remove(...a),
  },
}))

const { addWeightEntry, deleteWeightEntry, getWeightEntries, flushLocalWeights } = await import(
  './weightStore'
)

const ONLINE = (id = 'server-1') => ({ measurement: { id, measured_on: '2026-10-05', weight_kg: 80 } })
const OFFLINE = () => Promise.reject(new Error('offline'))

beforeEach(() => {
  storage.clear()
  uuidCounter = 0
  server.create.mockReset()
  server.list.mockReset()
  server.remove.mockReset()
})

/** Låter alla väntande mikrotask-kedjor (den optimistiska POSTen) köra klart. */
const settle = () => new Promise((r) => setTimeout(r, 0))

describe('vikt loggad offline går inte förlorad', () => {
  it('posten ligger kvar som väntande när servern inte svarar', async () => {
    server.create.mockImplementation(OFFLINE)
    addWeightEntry(80)
    await settle()

    const entries = getWeightEntries()
    expect(entries).toHaveLength(1)
    // `local-`-prefixet är både markör och idempotensnyckel.
    expect(entries[0]!.id.startsWith('local-')).toBe(true)
  })

  it('flushen skickar den och byter id mot serverradens', async () => {
    server.create.mockImplementation(OFFLINE)
    addWeightEntry(80)
    await settle()

    server.create.mockReset()
    server.create.mockResolvedValue(ONLINE('server-1'))
    await flushLocalWeights()

    expect(server.create).toHaveBeenCalledTimes(1)
    expect(getWeightEntries()[0]!.id).toBe('server-1')
  })

  it('skickar client_id så en re-POST inte ger en dubblett', async () => {
    server.create.mockImplementation(OFFLINE)
    const entry = addWeightEntry(80)
    await settle()

    server.create.mockReset()
    server.create.mockResolvedValue(ONLINE())
    await flushLocalWeights()

    expect(server.create).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: entry.id, weight_kg: 80 })
    )
  })

  // Det som gör flushen säker att köra om: en bekräftad post är inte längre
  // `local-`, så nästa körning hoppar över den.
  it('en andra flush skickar inget igen', async () => {
    server.create.mockResolvedValue(ONLINE())
    addWeightEntry(80)
    await settle()

    server.create.mockReset()
    await flushLocalWeights()
    await flushLocalWeights()
    expect(server.create).not.toHaveBeenCalled()
  })

  it('en post som lyckades direkt är inte väntande', async () => {
    server.create.mockResolvedValue(ONLINE('server-9'))
    addWeightEntry(80)
    await settle()
    expect(getWeightEntries()[0]!.id).toBe('server-9')
  })
})

describe('borttagning offline fastnar inte', () => {
  it('en bekräftad post som tas bort offline köas och skickas av flushen', async () => {
    server.create.mockResolvedValue(ONLINE('server-1'))
    const entry = addWeightEntry(80)
    await settle()

    // Borttagningen misslyckas (offline).
    server.list.mockImplementation(OFFLINE)
    deleteWeightEntry(getWeightEntries()[0]?.id ?? entry.id)
    await settle()
    expect(getWeightEntries()).toHaveLength(0)

    // Nätet är tillbaka: flushen tar bort serverraden.
    server.list.mockReset()
    server.list.mockResolvedValue({
      measurements: [
        { id: 'server-1', measured_on: entry.date, weight_kg: 80, waist_cm: null, chest_cm: null, hips_cm: null, arm_cm: null, thigh_cm: null, created_at: '' },
      ],
    })
    server.remove.mockResolvedValue({ ok: true })
    await flushLocalWeights()
    expect(server.remove).toHaveBeenCalledWith('server-1')

    // Kvitterad: en andra flush gör inget.
    server.remove.mockReset()
    await flushLocalWeights()
    expect(server.remove).not.toHaveBeenCalled()
  })

  // En post som aldrig nådde servern har ingen serverrad att ta bort — att
  // lista och leta skulle vara ett onödigt anrop på en trolig offline-väg.
  it('en väntande post som tas bort rör inte servern', async () => {
    server.create.mockImplementation(OFFLINE)
    addWeightEntry(80)
    await settle()

    deleteWeightEntry(getWeightEntries()[0]!.id)
    await settle()
    expect(server.list).not.toHaveBeenCalled()
    expect(server.remove).not.toHaveBeenCalled()
  })
})
