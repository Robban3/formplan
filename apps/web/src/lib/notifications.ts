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
  if (!r.enabled || Notification.permission !== 'granted') return () => {}

  const now = new Date()
  const [hh, mm] = r.time.split(':').map(Number)
  const nextOccurrence = r.days
    .map((day) => {
      const d = new Date(now)
      const diff = ((day - 1) - (now.getDay() === 0 ? 6 : now.getDay() - 1) + 7) % 7
      d.setDate(d.getDate() + diff)
      d.setHours(hh ?? 0, mm ?? 0, 0, 0)
      if (d <= now) d.setDate(d.getDate() + 7)
      return d
    })
    .sort((a, b) => a.getTime() - b.getTime())[0]

  if (!nextOccurrence) return () => {}

  const id = setTimeout(() => {
    if (Notification.permission !== 'granted') return
    new Notification(`FormPlan – ${r.label}`, {
      body: 'Dags att träna! Öppna appen för att komma igång.',
      icon: '/logo.svg',
    })
  }, nextOccurrence.getTime() - now.getTime())

  return () => clearTimeout(id)
}

// Schedules recurring daily water reminders at fixed daytime slots.
export function scheduleWaterReminders(): () => void {
  if (Notification.permission !== 'granted') return () => {}

  const timeouts = new Set<ReturnType<typeof setTimeout>>()

  function scheduleSlot(time: string) {
    const id = setTimeout(() => {
      timeouts.delete(id)
      if (Notification.permission !== 'granted') return
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
