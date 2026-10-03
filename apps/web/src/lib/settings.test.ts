import { describe, it, expect, vi, beforeEach } from 'vitest'

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
vi.stubGlobal('document', { documentElement: { classList: { toggle: () => {} } } })

const KEY = 'formplan_settings'
const FLAG = 'formplan_theme_default_dark'

/** Laddar modulen på nytt så dess engångskod körs mot aktuell lagring. */
async function freshSettings() {
  vi.resetModules()
  return await import('./settings')
}

beforeEach(() => storage.clear())

describe('mörkt läge som utgångsläge', () => {
  it('ger mörkt läge åt en helt ny användare', async () => {
    const { settingsStore } = await freshSettings()
    expect(settingsStore.getSnapshot().dark_mode).toBe(true)
  })

  // save() skriver hela objektet, och onboarding sätter calorie_goal — därför
  // bär varje befintlig användare ett uttryckligt dark_mode: false från tiden
  // då det var standardvärdet. Ett nytt standardvärde når aldrig dem.
  it('rättar ett gammalt sparat dark_mode: false en gång', async () => {
    storage.setItem(KEY, JSON.stringify({ dark_mode: false, calorie_goal: 2200 }))
    const { settingsStore } = await freshSettings()
    expect(settingsStore.getSnapshot().dark_mode).toBe(true)
    // Rättelsen skrivs ned, annars gäller den bara den här sessionen.
    expect(JSON.parse(storage.getItem(KEY)!).dark_mode).toBe(true)
    // Andra värden får inte gå förlorade.
    expect(settingsStore.getSnapshot().calorie_goal).toBe(2200)
  })

  // Det här är hela poängen: väljer användaren ljust ska det stå kvar.
  it('rör inte ett ljust läge som användaren valt efteråt', async () => {
    storage.setItem(KEY, JSON.stringify({ dark_mode: false }))
    const first = await freshSettings()
    expect(first.settingsStore.getSnapshot().dark_mode).toBe(true)

    // Användaren slår över till ljust.
    first.settingsStore.set('dark_mode', false)
    expect(JSON.parse(storage.getItem(KEY)!).dark_mode).toBe(false)

    // Nästa appstart — valet ska stå kvar.
    const second = await freshSettings()
    expect(second.settingsStore.getSnapshot().dark_mode).toBe(false)

    // Och gången efter det med.
    const third = await freshSettings()
    expect(third.settingsStore.getSnapshot().dark_mode).toBe(false)
  })

  it('sätter flaggan så rättelsen aldrig körs igen', async () => {
    storage.setItem(KEY, JSON.stringify({ dark_mode: false }))
    await freshSettings()
    expect(storage.getItem(FLAG)).toBe('1')
  })

  it('rör inte den som redan har mörkt läge', async () => {
    storage.setItem(KEY, JSON.stringify({ dark_mode: true, rest_seconds_default: 120 }))
    const { settingsStore } = await freshSettings()
    expect(settingsStore.getSnapshot().dark_mode).toBe(true)
    expect(settingsStore.getSnapshot().rest_seconds_default).toBe(120)
  })
})
