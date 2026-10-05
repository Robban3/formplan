import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications'
import type { Reminder } from './settings'

/**
 * Påminnelser.
 *
 * TVÅ buggar låg här, och den andra var den värre:
 *
 * 1. `Notification` finns inte i iOS WebView, så i appen gjorde växlarna under
 *    Inställningar ingenting alls.
 *
 * 2. Även på webben byggde allt på `setTimeout` + `new Notification()`, vilket
 *    bara fungerar MEDAN APPEN ÄR ÖPPEN. En påminnelse om att träna klockan
 *    18:00 kom alltså bara om du redan satt i appen 18:00 — precis när du inte
 *    behöver den. Det är inte en påminnelse.
 *
 * Native använder nu @capacitor/local-notifications, som lämnar över
 * schemaläggningen till operativsystemet: notisen kommer även när appen är
 * stängd. Webben behåller setTimeout-vägen, för där finns inget bättre — men
 * den är uttryckligen bäst-ansträngning, inte en garanti.
 */

const WATER_TIMES = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00']

/** Texterna kommer utifrån så modulen slipper känna till i18n. */
export interface NotificationTexts {
  reminderTitle: (label: string) => string
  reminderBody: string
  waterTitle: string
  waterBody: string
}

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

const native = () => Capacitor.isNativePlatform()

// ── Id-intervall ─────────────────────────────────────────────────────────────
// Operativsystemet identifierar en schemalagd notis med ett heltal, och en ny
// schemaläggning med samma id ERSÄTTER den gamla. Idén här är enklare än att
// försöka hålla stabila id:n per påminnelse: allt vi äger avbeställs innan
// nästa uppsättning läggs in, så index duger som nyckel även när användaren
// tar bort en påminnelse i mitten av listan.
const WATER_ID_BASE = 1000
const REMINDER_ID_BASE = 2000

/** Alla id:n den här modulen kan ha lagt in. */
function ownedIds(reminderCount: number): number[] {
  const ids = WATER_TIMES.map((_, i) => WATER_ID_BASE + i)
  // Sju veckodagar per påminnelse (se scheduleNative). Städa generöst: en
  // tidigare uppsättning kan ha varit större än den nuvarande.
  const slots = Math.max(reminderCount, 20)
  for (let i = 0; i < slots; i++) {
    for (let weekday = 1; weekday <= 7; weekday++) {
      ids.push(REMINDER_ID_BASE + i * 10 + weekday)
    }
  }
  return ids
}

/**
 * ISO-veckodag (1=mån … 7=sön) → Capacitors (1=sön, 2=mån … 7=lör).
 *
 * Inställningarna lagrar ISO. Utan omvandlingen hade varje påminnelse hamnat
 * en dag fel, och söndagspåminnelsen på lördag.
 */
function toCapacitorWeekday(isoDay: number): number {
  return (isoDay % 7) + 1
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hh, mm] = time.split(':').map(Number)
  return { hour: hh ?? 0, minute: mm ?? 0 }
}

// ── Behörighet ───────────────────────────────────────────────────────────────

export async function notificationPermission(): Promise<PermissionState> {
  if (native()) {
    try {
      const { display } = await LocalNotifications.checkPermissions()
      return display === 'prompt' || display === 'prompt-with-rationale' ? 'default' : display
    } catch {
      return 'unsupported'
    }
  }
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as PermissionState
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (native()) {
    try {
      const { display } = await LocalNotifications.requestPermissions()
      return display === 'prompt' || display === 'prompt-with-rationale' ? 'default' : display
    } catch {
      return 'unsupported'
    }
  }
  if (typeof Notification === 'undefined') return 'unsupported'
  return (await Notification.requestPermission()) as PermissionState
}

/** Visar en notis direkt (testknappen och bekräftelsen efter behörighet). */
export async function showNotificationNow(title: string, body: string): Promise<void> {
  if (native()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: WATER_ID_BASE - 1, // utanför de schemalagda intervallen
            title,
            body,
            // En sekund fram: iOS visar inte en notis som schemaläggs i dåtid.
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      })
    } catch {
      /* behörighet nekad — knappen är ändå dold då */
    }
    return
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/logo.svg' })
}

// ── Schemaläggning: native ───────────────────────────────────────────────────

async function scheduleNative(
  water: boolean,
  reminders: Reminder[],
  texts: NotificationTexts
): Promise<void> {
  // Avbeställ först. Utan detta låg en borttagen eller avstängd påminnelse
  // kvar i operativsystemet och fortsatte larma — inställningen i appen hade
  // ingen koppling till vad som faktiskt var schemalagt.
  try {
    await LocalNotifications.cancel({
      notifications: ownedIds(reminders.length).map((id) => ({ id })),
    })
  } catch {
    /* inget schemalagt än */
  }

  const notifications: LocalNotificationSchema[] = []

  if (water) {
    WATER_TIMES.forEach((time, i) => {
      notifications.push({
        id: WATER_ID_BASE + i,
        title: texts.waterTitle,
        body: texts.waterBody,
        schedule: {
          on: parseTime(time),
          repeats: true,
          // Android: låt notisen komma även när telefonen är i doze.
          allowWhileIdle: true,
        },
      })
    })
  }

  reminders.forEach((r, i) => {
    if (!r.enabled) return
    const { hour, minute } = parseTime(r.time)
    // En post PER VECKODAG: Capacitors `on` tar en veckodag, inte en lista.
    for (const isoDay of r.days) {
      notifications.push({
        id: REMINDER_ID_BASE + i * 10 + isoDay,
        title: texts.reminderTitle(r.label),
        body: texts.reminderBody,
        schedule: {
          on: { weekday: toCapacitorWeekday(isoDay), hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
      })
    }
  })

  if (notifications.length === 0) return
  try {
    await LocalNotifications.schedule({ notifications })
  } catch (err) {
    console.warn('Kunde inte schemalägga notiser:', err)
  }
}

// ── Schemaläggning: webb ─────────────────────────────────────────────────────

function msUntilNext(time: string, from = new Date()): number {
  const { hour, minute } = parseTime(time)
  const next = new Date(from)
  next.setHours(hour, minute, 0, 0)
  if (next <= from) next.setDate(next.getDate() + 1)
  return next.getTime() - from.getTime()
}

/**
 * Webbvägen: timers som bara lever så länge sidan är öppen.
 *
 * Behålls för att appen också körs i webbläsare, men den kan inte väcka
 * någon — se modulens inledning.
 */
function scheduleWeb(
  water: boolean,
  reminders: Reminder[],
  texts: NotificationTexts
): () => void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return () => {}
  }

  const timeouts = new Set<ReturnType<typeof setTimeout>>()
  // setTimeout kapas vid ett 32-bitars heltal (~24,8 dygn); dela upp längre väntan.
  const MAX_DELAY = 2_147_000_000

  function fire(title: string, body: string) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    new Notification(title, { body, icon: '/logo.svg' })
  }

  function armDaily(time: string, title: string, body: string) {
    const id = setTimeout(() => {
      timeouts.delete(id)
      fire(title, body)
      armDaily(time, title, body)
    }, msUntilNext(time))
    timeouts.add(id)
  }

  function armWeekly(r: Reminder, title: string, body: string) {
    const now = new Date()
    const { hour, minute } = parseTime(r.time)
    const next = r.days
      .map((day) => {
        const d = new Date(now)
        const diff = ((day - 1) - (now.getDay() === 0 ? 6 : now.getDay() - 1) + 7) % 7
        d.setDate(d.getDate() + diff)
        d.setHours(hour, minute, 0, 0)
        if (d <= now) d.setDate(d.getDate() + 7)
        return d
      })
      .sort((a, b) => a.getTime() - b.getTime())[0]
    if (!next) return

    const delay = next.getTime() - now.getTime()
    const id = setTimeout(
      () => {
        timeouts.delete(id)
        if (delay <= MAX_DELAY) fire(title, body)
        armWeekly(r, title, body)
      },
      Math.min(delay, MAX_DELAY)
    )
    timeouts.add(id)
  }

  if (water) for (const time of WATER_TIMES) armDaily(time, texts.waterTitle, texts.waterBody)
  for (const r of reminders) {
    if (r.enabled) armWeekly(r, texts.reminderTitle(r.label), texts.reminderBody)
  }

  return () => {
    for (const id of timeouts) clearTimeout(id)
    timeouts.clear()
  }
}

// ── Gemensam ingång ──────────────────────────────────────────────────────────

/**
 * Får det som är schemalagt att matcha inställningarna.
 *
 * Returnerar en städfunktion för webbtimrarna. I native äger operativsystemet
 * schemat — det ska INTE rivas när komponenten avmonteras, hela poängen är att
 * notisen kommer när appen är stängd. Därför en no-op där.
 */
export function syncNotifications(opts: {
  enabled: boolean
  water: boolean
  reminders: Reminder[]
  texts: NotificationTexts
}): () => void {
  const { enabled, water, reminders, texts } = opts

  if (native()) {
    // Avstängt betyder avbeställ allt, inte "låt ligga".
    void scheduleNative(enabled && water, enabled ? reminders : [], texts)
    return () => {}
  }

  if (!enabled) return () => {}
  return scheduleWeb(water, reminders, texts)
}
