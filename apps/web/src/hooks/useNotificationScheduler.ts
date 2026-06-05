import { useEffect } from 'react'
import { useSettings } from './useSettings'
import { scheduleReminderNotification, scheduleWaterReminders } from '../lib/notifications'

export function useNotificationScheduler() {
  const { notifications_enabled, water_reminder, reminders } = useSettings()

  useEffect(() => {
    if (!notifications_enabled || Notification.permission !== 'granted') return

    const cleanups: (() => void)[] = []

    if (water_reminder) {
      cleanups.push(scheduleWaterReminders())
    }

    for (const r of reminders) {
      if (r.enabled) cleanups.push(scheduleReminderNotification(r))
    }

    return () => cleanups.forEach((c) => c())
  }, [notifications_enabled, water_reminder, reminders])
}
