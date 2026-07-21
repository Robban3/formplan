import type { Reminder } from './settings'

const WATER_TIMES = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00']

function msUntilNext(time: string, from = new Date()): number {
  const [hh, mm] = time.split(':').map(Number)
  const next = new Date(from)
  next.setHours(hh ?? 0, mm ?? 0, 0, 0)
  if (next <= from) next.setDate(next.getDate() + 1)
  return next.getTime() - from.getTime()
}

export function scheduleReminderNotification(r: Reminder): () => void {
  // Notification saknas i vissa miljöer (iOS-webview m.fl.) — krascha inte.
  if (typeof Notification === 'undefined') return () => {}
  if (!r.enabled || Notification.permission !== 'granted') return () => {}

  // setTimeout delays are capped at a 32-bit int (~24.8 days); chunk longer waits.
  const MAX_DELAY = 2_147_000_000
  let id: ReturnType<typeof setTimeout>

  function arm() {
    const now = new Date()
    const [hh, mm] = r.time.split(':').map(Number)
    const next = r.days
      .map((day) => {
        const d = new Date(now)
        const diff = ((day - 1) - (now.getDay() === 0 ? 6 : now.getDay() - 1) + 7) % 7
        d.setDate(d.getDate() + diff)
        d.setHours(hh ?? 0, mm ?? 0, 0, 0)
        if (d <= now) d.setDate(d.getDate() + 7)
        return d
      })
      .sort((a, b) => a.getTime() - b.getTime())[0]
    if (!next) return

    const delay = next.getTime() - now.getTime()
    if (delay > MAX_DELAY) {
      id = setTimeout(arm, MAX_DELAY)
      return
    }
    id = setTimeout(() => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(`FormPlan – ${r.label}`, {
          body: 'Dags att träna! Öppna appen för att komma igång.',
          icon: '/logo.svg',
        })
      }
      arm() // re-arm for the next occurrence
    }, delay)
  }

  arm()
  return () => clearTimeout(id)
}

// Schedules recurring daily water reminders at fixed daytime slots.
export function scheduleWaterReminders(): () => void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return () => {}
  }

  const timeouts = new Set<ReturnType<typeof setTimeout>>()

  function scheduleSlot(time: string) {
    const id = setTimeout(() => {
      timeouts.delete(id)
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      new Notification('FormPlan', {
        body: 'Dags att dricka vatten!',
        icon: '/logo.svg',
      })
      scheduleSlot(time)
    }, msUntilNext(time))
    timeouts.add(id)
  }

  for (const time of WATER_TIMES) scheduleSlot(time)

  return () => {
    for (const id of timeouts) clearTimeout(id)
    timeouts.clear()
  }
}
