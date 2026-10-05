import { useEffect } from 'react'
import { useSettings } from './useSettings'
import { useT } from './useT'
import { syncNotifications } from '../lib/notifications'

/**
 * Håller det som är schemalagt i linje med inställningarna.
 *
 * Hooken kontrollerade tidigare `Notification.permission` själv och hoppade av
 * när API:t saknades — vilket det gör i iOS WebView, så i appen gjorde den
 * ingenting. Behörigheten hör i notifications.ts, som känner båda
 * plattformarna; här finns bara kopplingen inställningar → schema.
 *
 * Texterna skickas in: notistexterna låg hårdkodade på svenska i
 * notifications.ts och följde inte appens språk.
 */
export function useNotificationScheduler() {
  const { notifications_enabled, water_reminder, reminders } = useSettings()
  const { t } = useT()

  useEffect(() => {
    return syncNotifications({
      enabled: notifications_enabled,
      water: water_reminder,
      reminders,
      texts: {
        reminderTitle: (label) => t('notif.reminderTitle', { label }),
        reminderBody: t('notif.reminderBody'),
        waterTitle: t('notif.waterTitle'),
        waterBody: t('notif.waterBody'),
      },
    })
    // `t` ändras när språket byts — då ska schemat läggas om med nya texter.
  }, [notifications_enabled, water_reminder, reminders, t])
}
