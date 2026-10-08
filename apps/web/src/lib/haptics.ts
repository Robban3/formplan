import { Capacitor } from '@capacitor/core'
import { Haptics, NotificationType } from '@capacitor/haptics'

/**
 * Haptisk återkoppling.
 *
 * `navigator.vibrate` finns inte på iOS — varken i Safari eller i WebView.
 * Apple har aldrig implementerat Vibration API:t. Firandet när man nådde
 * vattenmålet gav alltså ingen känsla alls på iPhone, och det syntes inte i
 * koden eftersom `?.` gör raden till en tyst no-op. Samma mönster som
 * wakeLock och notiserna hade.
 *
 * I appen går det nu via Capacitors Haptics, som använder Taptic Engine på
 * iOS och vibratorn på Android. På webben står `navigator.vibrate` kvar —
 * det fungerar i Chrome på Android, och är det enda som finns där.
 */

/**
 * En kort serie som markerar att något lyckats.
 *
 * iOS exponerar inte godtyckliga vibrationsmönster, bara fördefinierade
 * typer. `NotificationType.Success` är den som motsvarar ett uppnått mål —
 * att försöka härma mönstret [100, 50, 100] med flera anrop i rad hade känts
 * som ett fel, inte som ett firande.
 */
export function hapticSuccess(): void {
  if (Capacitor.isNativePlatform()) {
    void Haptics.notification({ type: NotificationType.Success }).catch(() => {
      /* enheten saknar haptik, eller användaren har stängt av den */
    })
    return
  }
  // Webben: finns bara i Chrome på Android, no-op i övrigt.
  navigator.vibrate?.([100, 50, 100])
}
