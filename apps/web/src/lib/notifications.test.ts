import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Reminder } from './settings'

/**
 * Notisschemat i native.
 *
 * Två buggar: `Notification` finns inte i iOS WebView, så växlarna gjorde
 * ingenting i appen — och allt byggde på `setTimeout`, som bara fungerar medan
 * appen är öppen. En påminnelse klockan 18:00 kom alltså bara om du redan satt
 * i appen 18:00.
 *
 * Testet kontrollerar vad som LÄMNAS ÖVER till operativsystemet. Det är där
 * misstagen bor: veckodagsnumreringen skiljer sig mellan inställningarna och
 * Capacitor, och ett avstängt läge måste avbeställa det som redan ligger
 * schemalagt i stället för att bara sluta lägga till.
 */

const cap = { native: true }
const plugin = { schedule: vi.fn(), cancel: vi.fn() }

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => cap.native },
}))
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: (...a: unknown[]) => plugin.schedule(...a),
    cancel: (...a: unknown[]) => plugin.cancel(...a),
    checkPermissions: async () => ({ display: 'granted' }),
    requestPermissions: async () => ({ display: 'granted' }),
  },
}))

const { syncNotifications } = await import('./notifications')

const texts = {
  reminderTitle: (label: string) => `FormPlan – ${label}`,
  reminderBody: 'Dags att träna!',
  waterTitle: 'FormPlan',
  waterBody: 'Dags att dricka vatten!',
}

const reminder = (over: Partial<Reminder> = {}): Reminder => ({
  id: 'r1',
  days: [1],
  time: '18:00',
  label: 'Styrka',
  enabled: true,
  ...over,
})

/** Låter den asynkrona schemaläggningen inuti syncNotifications köra klart. */
const settle = () => new Promise((r) => setTimeout(r, 0))

/** Alla notisposter som skickats till plugin.schedule. */
function scheduled(): { id: number; title: string; schedule: Record<string, unknown> }[] {
  return plugin.schedule.mock.calls.flatMap((c) => (c[0] as { notifications: never[] }).notifications)
}

beforeEach(() => {
  cap.native = true
  plugin.schedule.mockReset()
  plugin.schedule.mockResolvedValue(undefined)
  plugin.cancel.mockReset()
  plugin.cancel.mockResolvedValue(undefined)
})

describe('veckodagen översätts till Capacitors numrering', () => {
  /**
   * Inställningarna lagrar ISO (1=mån … 7=sön), Capacitor räknar 1=sön,
   * 2=mån … 7=lör. Utan omvandlingen hamnade varje påminnelse en dag fel, och
   * söndagspåminnelsen på lördag.
   */
  const CASES: [number, number, string][] = [
    [1, 2, 'måndag'],
    [2, 3, 'tisdag'],
    [5, 6, 'fredag'],
    [6, 7, 'lördag'],
    [7, 1, 'söndag'],
  ]

  for (const [iso, expected, name] of CASES) {
    it(`${name}: ISO ${iso} → ${expected}`, async () => {
      syncNotifications({ enabled: true, water: false, reminders: [reminder({ days: [iso] })], texts })
      await settle()
      const on = scheduled()[0]!.schedule.on as { weekday: number; hour: number; minute: number }
      expect(on.weekday).toBe(expected)
      expect(on.hour).toBe(18)
      expect(on.minute).toBe(0)
    })
  }
})

describe('vad som schemaläggs', () => {
  it('en påminnelse med tre dagar ger tre poster', async () => {
    syncNotifications({ enabled: true, water: false, reminders: [reminder({ days: [1, 3, 5] })], texts })
    await settle()
    expect(scheduled()).toHaveLength(3)
    // Unika id:n, annars ersätter de varandra i operativsystemet.
    expect(new Set(scheduled().map((n) => n.id)).size).toBe(3)
  })

  it('vattenpåminnelser blir sex dagliga poster', async () => {
    syncNotifications({ enabled: true, water: true, reminders: [], texts })
    await settle()
    const all = scheduled()
    expect(all).toHaveLength(6)
    // Dagligen, inte veckovis: ingen weekday ska vara satt.
    expect(all[0]!.schedule).toMatchObject({ repeats: true })
    expect(all[0]!.schedule).not.toHaveProperty('on.weekday')
  })

  it('repeats är satt — annars kommer notisen en gång och aldrig mer', async () => {
    syncNotifications({ enabled: true, water: true, reminders: [reminder()], texts })
    await settle()
    for (const n of scheduled()) expect(n.schedule.repeats).toBe(true)
  })

  it('en avstängd påminnelse schemaläggs inte', async () => {
    syncNotifications({
      enabled: true,
      water: false,
      reminders: [reminder({ enabled: false })],
      texts,
    })
    await settle()
    expect(plugin.schedule).not.toHaveBeenCalled()
  })

  it('titeln följer påminnelsens etikett', async () => {
    syncNotifications({ enabled: true, water: false, reminders: [reminder({ label: 'Ben' })], texts })
    await settle()
    expect(scheduled()[0]!.title).toBe('FormPlan – Ben')
  })
})

describe('avstängt avbeställer det som redan ligger', () => {
  /**
   * Det här är skillnaden mellan att sluta lägga till och att städa upp. Utan
   * avbeställningen låg en borttagen eller avstängd påminnelse kvar i
   * operativsystemet och fortsatte larma — växeln i appen hade ingen koppling
   * till vad som faktiskt var schemalagt.
   */
  it('avbeställer före varje ny schemaläggning', async () => {
    syncNotifications({ enabled: true, water: true, reminders: [], texts })
    await settle()
    expect(plugin.cancel).toHaveBeenCalled()
    const ids = (plugin.cancel.mock.calls[0]![0] as { notifications: { id: number }[] }).notifications
    expect(ids.length).toBeGreaterThan(6)
  })

  it('avstängda notiser avbeställer och schemalägger inget', async () => {
    syncNotifications({ enabled: false, water: true, reminders: [reminder()], texts })
    await settle()
    expect(plugin.cancel).toHaveBeenCalled()
    expect(plugin.schedule).not.toHaveBeenCalled()
  })
})

describe('städfunktionen', () => {
  /**
   * I native äger operativsystemet schemat. Rev vi det vid avmontering vore
   * hela poängen borta: notisen ska komma när appen är STÄNGD.
   */
  it('river inte schemat i native', async () => {
    const cleanup = syncNotifications({ enabled: true, water: true, reminders: [], texts })
    await settle()
    plugin.cancel.mockReset()
    cleanup()
    expect(plugin.cancel).not.toHaveBeenCalled()
  })
})

describe('webben', () => {
  it('rör inte Capacitor-pluginet', async () => {
    cap.native = false
    syncNotifications({ enabled: true, water: true, reminders: [reminder()], texts })
    await settle()
    expect(plugin.schedule).not.toHaveBeenCalled()
    expect(plugin.cancel).not.toHaveBeenCalled()
  })
})
